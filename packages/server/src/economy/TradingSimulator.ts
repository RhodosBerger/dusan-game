// packages/server/src/economy/TradingSimulator.ts
import { PrismaClient } from '@prisma/client';
import { QuestTriggerManager, PlayerWithQuests, Quest } from '@dusan-game/shared';

const prisma = new PrismaClient();

// Helper to progress Quest stats in database using shared QuestTriggerManager
export class ServerQuestIntegration {
  static async progressQuest(prismaTx: any, playerId: string, objectiveType: string, amount: number) {
    const player = await prismaTx.player.findUnique({
      where: { id: playerId }
    });
    if (!player) return;

    const dbQuests = await prismaTx.playerQuest.findMany({
      where: { playerId }
    });

    const quests: Quest[] = dbQuests.map((q: any) => ({
      id: q.questKey,
      title: q.questKey,
      description: q.questKey,
      objectiveType: q.questKey.includes('TRADE') ? 'TRADE_CARDS' : 'DEFEAT_NPC',
      targetValue: q.targetValue,
      progress: q.progress,
      completed: q.completed,
      xpReward: q.xpReward
    }));

    const playerWrapper: PlayerWithQuests = {
      id: playerId,
      quests,
      materials: {},
      gainXP(xp: number) {}
    };

    QuestTriggerManager.updateQuestProgress(
      playerWrapper,
      objectiveType as any,
      amount
    );

    for (const q of playerWrapper.quests) {
      const original = dbQuests.find((dbQ: any) => dbQ.questKey === q.id);
      if (original && (original.progress !== q.progress || original.completed !== q.completed)) {
        await prismaTx.playerQuest.update({
          where: { playerId_questKey: { playerId, questKey: q.id } },
          data: {
            progress: q.progress,
            completed: q.completed
          }
        });

        if (q.completed && !original.completed) {
          await prismaTx.player.update({
            where: { id: playerId },
            data: { xp: { increment: q.xpReward } }
          });
        }
      }
    }
  }
}

export class TradingSimulator {
  /**
   * Creates a pending trade offer for a card.
   */
  static async createTradeOffer(
    senderId: string,
    offeredCardId: string,
    requestedCardDef: string,
    receiverId?: string
  ): Promise<any> {
    return prisma.$transaction(async (tx: any) => {
      // 1. Confirm that sender owns the card
      const card = await tx.playerCard.findFirst({
        where: { id: offeredCardId, playerId: senderId }
      });
      if (!card) {
        throw new Error('ERR_CARD_NOT_FOUND_OR_OWNED');
      }

      // 2. Create the trade record
      const trade = await tx.cardTrade.create({
        data: {
          senderId,
          receiverId: receiverId || null,
          offeredCardId,
          requestedCardDef,
          status: 'PENDING'
        }
      });

      console.log(`[TRADE] Player ${senderId} offered card ${card.cardDefinitionId} for ${requestedCardDef}.`);
      return trade;
    });
  }

  /**
   * Accepts a pending trade offer. Performs atomic card swap and updates quests.
   */
  static async acceptTradeOffer(
    receiverId: string,
    tradeId: string,
    acceptedCardId: string
  ): Promise<any> {
    return prisma.$transaction(async (tx: any) => {
      // 1. Find the trade
      const trade = await tx.cardTrade.findUnique({
        where: { id: tradeId }
      });
      if (!trade || trade.status !== 'PENDING') {
        throw new Error('ERR_TRADE_NOT_PENDING');
      }

      // If receiver specific, check ownership
      if (trade.receiverId && trade.receiverId !== receiverId) {
        throw new Error('ERR_UNAUTHORIZED_RECEIVER');
      }

      // 2. Verify receiver owns the card they are giving (which must match trade's requestedCardDef)
      const receiverCard = await tx.playerCard.findFirst({
        where: { id: acceptedCardId, playerId: receiverId }
      });
      if (!receiverCard || receiverCard.cardDefinitionId !== trade.requestedCardDef) {
        throw new Error('ERR_INVALID_ACCEPTED_CARD');
      }

      // 3. Verify sender still owns the offered card
      const senderCard = await tx.playerCard.findFirst({
        where: { id: trade.offeredCardId, playerId: trade.senderId }
      });
      if (!senderCard) {
        throw new Error('ERR_OFFERED_CARD_NO_LONGER_AVAILABLE');
      }

      // 4. Perform atomic swap: change ownerIds
      await tx.playerCard.update({
        where: { id: trade.offeredCardId },
        data: { playerId: receiverId }
      });

      await tx.playerCard.update({
        where: { id: acceptedCardId },
        data: { playerId: trade.senderId }
      });

      // 5. Update trade status to COMPLETED
      const completedTrade = await tx.cardTrade.update({
        where: { id: tradeId },
        data: { status: 'COMPLETED' }
      });

      // 6. Update quest progress for both players
      await ServerQuestIntegration.progressQuest(tx, trade.senderId, 'TRADE_CARDS', 1);
      await ServerQuestIntegration.progressQuest(tx, receiverId, 'TRADE_CARDS', 1);

      console.log(`[TRADE COMPLETED] Swapped sender card ${senderCard.cardDefinitionId} with receiver card ${receiverCard.cardDefinitionId}.`);
      return completedTrade;
    });
  }

  /**
   * Lists all active pending trade offers.
   */
  static async listPendingOffers(playerId: string): Promise<any[]> {
    return prisma.cardTrade.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { receiverId: null },
          { receiverId: playerId }
        ]
      }
    });
  }
}
