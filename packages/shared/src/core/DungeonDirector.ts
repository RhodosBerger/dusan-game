export type RoomType = 'Entrance' | 'Crypt' | 'Shrine' | 'Treasury' | 'BossChamber';

export interface DungeonRoom {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  connections: string[]; // Zoznam ID susedných miestností
  difficulty: number; // Stupeň náročnosti (1 - 5)
  contents: string[];  // Zoznam nepriateľov, truhiel alebo svätýň
}

export interface DungeonState {
  rooms: DungeonRoom[];
  turnCounter: number;
  totalEntropy: number;
}

/**
 * Dungeon Director
 * Generuje procedurálnu dnd mapu miestností a riadi periodické spawnovacie rytmy.
 */
export class DungeonDirector {
  /**
   * Vygeneruje pevný D&D svet (Dungeon) so 6 prepojenými miestnosťami
   */
  public static generateDungeon(): DungeonState {
    const rooms: DungeonRoom[] = [
      {
        id: 'room_entrance',
        name: 'Vstup do Podzemia (Entrance)',
        type: 'Entrance',
        x: 0,
        y: 0,
        connections: ['room_crypt', 'room_shrine'],
        difficulty: 1,
        contents: []
      },
      {
        id: 'room_crypt',
        name: 'Staroveká Krypta (Crypt)',
        type: 'Crypt',
        x: 1,
        y: 0,
        connections: ['room_entrance', 'room_treasury', 'room_spore_cave'],
        difficulty: 2,
        contents: ['Skeleton Watcher']
      },
      {
        id: 'room_shrine',
        name: 'Svätyňa Svetla (Shrine)',
        type: 'Shrine',
        x: 0,
        y: 1,
        connections: ['room_entrance', 'room_spore_cave'],
        difficulty: 1,
        contents: ['Altar of Light']
      },
      {
        id: 'room_spore_cave',
        name: 'Plesnivá Jaskyňa (Spore Cave)',
        type: 'Crypt',
        x: 1,
        y: 1,
        connections: ['room_crypt', 'room_shrine', 'room_boss'],
        difficulty: 3,
        contents: ['Fungal Beast']
      },
      {
        id: 'room_treasury',
        name: 'Stratená Pokladnica (Treasury)',
        type: 'Treasury',
        x: 2,
        y: 0,
        connections: ['room_crypt', 'room_boss'],
        difficulty: 3,
        contents: ['Loot Chest']
      },
      {
        id: 'room_boss',
        name: 'Trónna Sála Overlorda (Boss Chamber)',
        type: 'BossChamber',
        x: 2,
        y: 2,
        connections: ['room_spore_cave', 'room_treasury'],
        difficulty: 5,
        contents: ['Crystal Golem Boss']
      }
    ];

    return {
      rooms,
      turnCounter: 1,
      totalEntropy: 0.1
    };
  }

  /**
   * Posunie čas v dungeone a spustí spawnovacie rytmy na základe ťahového cyklu a energie systému
   */
  public static tickDungeon(state: DungeonState, systemEnergy: number): { state: DungeonState; spawnLogs: string[] } {
    const nextState = JSON.parse(JSON.stringify(state)) as DungeonState;
    nextState.turnCounter++;
    const spawnLogs: string[] = [];

    // 1. Rytmus Napätia (Tension Tick - každé 3 kolá)
    if (nextState.turnCounter % 3 === 0) {
      nextState.totalEntropy = Math.min(1.0, nextState.totalEntropy + 0.1);
      spawnLogs.push(`[Tension Tick] Globálna entropia dungeonu stúpla na ${(nextState.totalEntropy * 100).toFixed(0)}%.`);

      // Spawnovanie nepriateľov v prázdnych Crypt miestnostiach
      nextState.rooms.forEach(room => {
        if (room.type === 'Crypt' && room.contents.length === 0) {
          const spawnChance = 0.40;
          if (Math.random() < spawnChance) {
            room.contents.push('Ambushing Spore-Boar');
            spawnLogs.push(`[Spawn] V miestnosti "${room.name}" sa zrodil diviak (Ambushing Spore-Boar).`);
          }
        }
      });
    }

    // 2. Rytmus Zdroja (Resource Tick - každé 5 kôl)
    if (nextState.turnCounter % 5 === 0) {
      nextState.rooms.forEach(room => {
        if (room.type === 'Treasury' && !room.contents.includes('Loot Chest')) {
          room.contents.push('Loot Chest');
          spawnLogs.push(`[Resource Tick] V pokladnici "${room.name}" sa objavila nová truhlica.`);
        }
        if (room.type === 'Shrine' && room.contents.length === 0) {
          room.contents.push('Altar of Light');
          spawnLogs.push(`[Resource Tick] Svätyňa "${room.name}" sa nabila a je znova pripravená.`);
        }
      });
    }

    // 3. Rytmus Preťaženia (Overload Tick - ak systemEnergy > 75)
    if (systemEnergy > 75) {
      const bossRoom = nextState.rooms.find(r => r.type === 'BossChamber');
      if (bossRoom && !bossRoom.contents.includes('Elite Void Sentinel')) {
        bossRoom.contents.push('Elite Void Sentinel');
        spawnLogs.push(`[Overload Tick] Kritická systémová energia (${systemEnergy}%) vyvolala strážcu (Elite Void Sentinel) v Boss komnate!`);
      }
    }

    return {
      state: nextState,
      spawnLogs
    };
  }
}
