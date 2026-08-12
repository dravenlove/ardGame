import type { Card } from "./types";

export const CARD_LIBRARY: Card[] = [
  {
    id: "ember-fox",
    name: "赤焰灵狐",
    cost: 2,
    kind: "unit",
    element: "fire",
    attack: 3,
    health: 2,
    description: "迅捷灵兽。擅长撕开敌方阵线。",
    sigil: "狐",
  },
  {
    id: "moon-swordsman",
    name: "月痕剑侍",
    cost: 3,
    kind: "unit",
    element: "moon",
    attack: 3,
    health: 4,
    description: "月下守誓的剑士，攻守均衡。",
    sigil: "剑",
  },
  {
    id: "stone-guardian",
    name: "玄岩守卫",
    cost: 4,
    kind: "unit",
    element: "nature",
    attack: 2,
    health: 7,
    description: "由古老山魂唤醒的沉默守护者。",
    sigil: "岩",
  },
  {
    id: "ember-charm",
    name: "烬火符",
    cost: 2,
    kind: "spell",
    element: "fire",
    description: "对敌方英雄造成 4 点伤害。",
    sigil: "焰",
  },
  {
    id: "spirit-echo",
    name: "灵息回响",
    cost: 2,
    kind: "spell",
    element: "wind",
    description: "为己方英雄恢复 5 点生命。",
    sigil: "息",
  },
  {
    id: "starfall",
    name: "星陨",
    cost: 5,
    kind: "spell",
    element: "void",
    description: "对所有敌方单位造成 3 点伤害。",
    sigil: "陨",
  },
  {
    id: "cloud-crane",
    name: "踏云仙鹤",
    cost: 3,
    kind: "unit",
    element: "wind",
    attack: 4,
    health: 3,
    description: "振翅而至，卷起切断邪祟的罡风。",
    sigil: "鹤",
  },
  {
    id: "void-watcher",
    name: "幽渊观星者",
    cost: 5,
    kind: "unit",
    element: "void",
    attack: 5,
    health: 5,
    description: "她从群星背面窥见胜负的倒影。",
    sigil: "星",
  },
];

export function makeDeck(): Card[] {
  const order = [0, 3, 1, 4, 6, 2, 5, 7, 0, 1, 3, 6];
  return order.map((index, copy) => ({
    ...CARD_LIBRARY[index],
    id: `${CARD_LIBRARY[index].id}-${copy}`,
  }));
}
