import { Instruction } from './Instruction';

export class ActionNode {
  id: string;
  instruction: Instruction;
  sourceId: string;
  targetId: string | null;
  reactions: ActionNode[];

  constructor(id: string, instruction: Instruction, sourceId: string, targetId: string | null = null) {
    this.id = id;
    this.instruction = instruction;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.reactions = [];
  }

  calculateTotalArmor(): number {
    let totalA = 0;
    for (const reaction of this.reactions) {
      totalA += reaction.instruction.armor;
      totalA += reaction.calculateTotalArmor();
    }
    return totalA;
  }
}
