export type CardKind = "unit" | "spell";
export type Element = "fire" | "moon" | "wind" | "void" | "nature";

export type Card = {
  id: string;
  name: string;
  cost: number;
  kind: CardKind;
  element: Element;
  attack?: number;
  health?: number;
  description: string;
  sigil: string;
};

export type Unit = Card & {
  instanceId: string;
  attack: number;
  health: number;
  maxHealth: number;
  canAttack: boolean;
};

export type BattleLog = {
  id: number;
  tone: "player" | "enemy" | "system";
  text: string;
};

export type GameState = {
  round: number;
  turn: "player" | "enemy";
  phaseLabel: string;
  playerHealth: number;
  enemyHealth: number;
  maxPlayerHealth: number;
  maxEnemyHealth: number;
  energy: number;
  maxEnergy: number;
  enemyEnergy: number;
  hand: Card[];
  deck: Card[];
  playerBoard: Unit[];
  enemyBoard: Unit[];
  selectedCardId: string | null;
  selectedAttackerId: string | null;
  logs: BattleLog[];
  winner: "player" | "enemy" | null;
};

export type ClientCommand =
  | { type: "play_card"; cardId: string }
  | { type: "attack_unit"; attackerId: string; targetId: string }
  | { type: "attack_hero"; attackerId: string }
  | { type: "end_turn" }
  | { type: "restart" };

export type ServerEvent =
  | { type: "snapshot"; state: GameState }
  | { type: "command_rejected"; reason: string }
  | { type: "connection"; status: "online" | "offline" };
