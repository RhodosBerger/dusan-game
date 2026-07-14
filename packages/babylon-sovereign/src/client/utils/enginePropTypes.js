import PropTypes from 'prop-types';

export const BlockPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  threadId: PropTypes.string,
  biome: PropTypes.string.isRequired,
  temperature: PropTypes.number.isRequired,
  humidity: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  friction: PropTypes.number.isRequired,
  conductivity: PropTypes.number.isRequired,
  colorSaturation: PropTypes.number,
  textureDensity: PropTypes.number,
  lightEmission: PropTypes.number,
  contrastRatio: PropTypes.number,
  particleRate: PropTypes.number,
  walkable: PropTypes.bool.isRequired,
  energyCostMultiplier: PropTypes.number.isRequired,
  rangeModifier: PropTypes.number.isRequired,
  hazardIndex: PropTypes.number.isRequired,
  lootProbability: PropTypes.number.isRequired,
  hasChest: PropTypes.bool,
  isTown: PropTypes.bool,
  hasTrap: PropTypes.oneOf(['ROOT_TRAP', 'EMP_MINE', null]),
  trapOwnerId: PropTypes.string,
  hasOpportunity: PropTypes.oneOf(['SURGE_NODE', 'VOID_RIFT', 'REPAIR_KIT', null])
});

export const ChunkPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  blocks: PropTypes.arrayOf(BlockPropType).isRequired
});

export const ThreadPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['PLAYER', 'NPC', 'HELPER']).isRequired,
  ownerId: PropTypes.string,
  health: PropTypes.number.isRequired,
  maxHealth: PropTypes.number.isRequired,
  armor: PropTypes.number.isRequired,
  attackReach: PropTypes.number.isRequired,
  spellReach: PropTypes.number.isRequired,
  movementBase: PropTypes.number.isRequired,
  hasFreeClockCycle: PropTypes.bool.isRequired,
  axiomaticFlags: PropTypes.object,
  handLimit: PropTypes.number.isRequired,
  materials: PropTypes.objectOf(PropTypes.number).isRequired,
  quests: PropTypes.array.isRequired,
  level: PropTypes.number.isRequired,
  xp: PropTypes.number.isRequired,
  baseDamage: PropTypes.number.isRequired,
  luck: PropTypes.number.isRequired,
  isSlowed: PropTypes.bool.isRequired,
  isRooted: PropTypes.bool.isRequired,
  isSilenced: PropTypes.bool.isRequired,
  isDisarmed: PropTypes.bool.isRequired,
  freeMovementUsed: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    meta: PropTypes.number,
    hex: PropTypes.number
  }).isRequired,
  currentBuffer: PropTypes.array.isRequired,
  discardPile: PropTypes.array.isRequired,
  deck: PropTypes.array.isRequired
});

export const TurnStateMachinePropType = PropTypes.shape({
  activePlayerId: PropTypes.string,
  baseActivePlayerId: PropTypes.string,
  currentPhase: PropTypes.string.isRequired,
  timerLeft: PropTypes.number.isRequired,
  hasActiveChain: PropTypes.bool.isRequired,
  turnNumber: PropTypes.number.isRequired
});

export const EnginePropType = PropTypes.shape({
  state: PropTypes.string.isRequired,
  systemEnergy: PropTypes.number.isRequired,
  globalEntropy: PropTypes.number.isRequired,
  turnsElapsed: PropTypes.number.isRequired,
  threads: PropTypes.arrayOf(ThreadPropType).isRequired,
  actionNetwork: PropTypes.array.isRequired,
  turnStateMachine: TurnStateMachinePropType.isRequired,
  dungeonState: PropTypes.object,
  map: PropTypes.arrayOf(ChunkPropType).isRequired
});
