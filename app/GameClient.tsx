"use client";

import { useEffect, useReducer, useState } from "react";
import { CARD_LIBRARY, makeDeck } from "./game/cards";
import type { BattleLog, Card, GameState, Unit } from "./game/types";

type Action =
  | { type: "select_card"; id: string | null }
  | { type: "play_card"; id: string }
  | { type: "select_attacker"; id: string }
  | { type: "attack_unit"; targetId: string }
  | { type: "attack_hero" }
  | { type: "end_turn" }
  | { type: "resolve_enemy_turn" }
  | { type: "restart" };

const MAX_BOARD = 4;
let logId = 10;
let unitId = 10;

function log(tone: BattleLog["tone"], text: string): BattleLog {
  return { id: logId++, tone, text };
}

function asUnit(card: Card, canAttack = false): Unit {
  return {
    ...card,
    instanceId: `${card.id}-unit-${unitId++}`,
    attack: card.attack ?? 0,
    health: card.health ?? 1,
    maxHealth: card.health ?? 1,
    canAttack,
  };
}

function initialState(): GameState {
  const deck = makeDeck();
  return {
    round: 3,
    turn: "player",
    phaseLabel: "你的行动",
    playerHealth: 24,
    enemyHealth: 20,
    maxPlayerHealth: 30,
    maxEnemyHealth: 30,
    energy: 5,
    maxEnergy: 5,
    enemyEnergy: 4,
    hand: deck.slice(0, 5),
    deck: deck.slice(5),
    playerBoard: [asUnit({ ...CARD_LIBRARY[1], id: "starter-swordsman" }, true)],
    enemyBoard: [
      asUnit({ ...CARD_LIBRARY[2], id: "enemy-stone", name: "荒土石傀", attack: 2, health: 5 }),
      asUnit({ ...CARD_LIBRARY[0], id: "enemy-fox", name: "噬火妖狐", attack: 3, health: 2 }),
    ],
    selectedCardId: null,
    selectedAttackerId: null,
    logs: [
      log("system", "第 3 回合开始，灵力已恢复。"),
      log("enemy", "夜魇祭司召唤了噬火妖狐。"),
      log("player", "轮到你了。选择手牌或可行动的单位。"),
    ],
    winner: null,
  };
}

function finish(state: GameState): GameState {
  if (state.enemyHealth <= 0) {
    return { ...state, enemyHealth: 0, winner: "player", phaseLabel: "胜利" };
  }
  if (state.playerHealth <= 0) {
    return { ...state, playerHealth: 0, winner: "enemy", phaseLabel: "战败" };
  }
  return state;
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "restart") return initialState();
  if (state.winner) return state;

  if (action.type === "select_card") {
    if (state.turn !== "player") return state;
    return {
      ...state,
      selectedCardId: action.id === state.selectedCardId ? null : action.id,
      selectedAttackerId: null,
    };
  }

  if (action.type === "play_card") {
    if (state.turn !== "player") return state;
    const card = state.hand.find((item) => item.id === action.id);
    if (!card) return state;
    if (card.cost > state.energy) {
      return { ...state, logs: [log("system", "灵力不足，无法打出这张牌。"), ...state.logs] };
    }
    if (card.kind === "unit" && state.playerBoard.length >= MAX_BOARD) {
      return { ...state, logs: [log("system", "己方阵位已满。"), ...state.logs] };
    }

    const next: GameState = {
      ...state,
      energy: state.energy - card.cost,
      hand: state.hand.filter((item) => item.id !== card.id),
      selectedCardId: null,
      logs: [log("player", `你打出了「${card.name}」。`), ...state.logs],
    };
    if (card.kind === "unit") {
      next.playerBoard = [...state.playerBoard, asUnit(card)];
    } else if (card.name === "烬火符") {
      next.enemyHealth -= 4;
      next.logs = [log("player", "烬火化作流光，造成 4 点伤害。"), ...next.logs];
    } else if (card.name === "灵息回响") {
      next.playerHealth = Math.min(next.maxPlayerHealth, next.playerHealth + 5);
      next.logs = [log("player", "清风回旋，你恢复了 5 点生命。"), ...next.logs];
    } else if (card.name === "星陨") {
      next.enemyBoard = state.enemyBoard
        .map((unit) => ({ ...unit, health: unit.health - 3 }))
        .filter((unit) => unit.health > 0);
      next.logs = [log("player", "群星坠落，敌方全体受到 3 点伤害。"), ...next.logs];
    }
    return finish(next);
  }

  if (action.type === "select_attacker") {
    if (state.turn !== "player") return state;
    const unit = state.playerBoard.find((item) => item.instanceId === action.id);
    if (!unit?.canAttack) {
      return { ...state, logs: [log("system", "该单位本回合无法行动。"), ...state.logs] };
    }
    return {
      ...state,
      selectedAttackerId: state.selectedAttackerId === action.id ? null : action.id,
      selectedCardId: null,
    };
  }

  if (action.type === "attack_unit") {
    if (!state.selectedAttackerId || state.turn !== "player") return state;
    const attacker = state.playerBoard.find((unit) => unit.instanceId === state.selectedAttackerId);
    const target = state.enemyBoard.find((unit) => unit.instanceId === action.targetId);
    if (!attacker?.canAttack || !target) return state;
    const playerBoard = state.playerBoard
      .map((unit) =>
        unit.instanceId === attacker.instanceId
          ? { ...unit, health: unit.health - target.attack, canAttack: false }
          : unit,
      )
      .filter((unit) => unit.health > 0);
    const enemyBoard = state.enemyBoard
      .map((unit) =>
        unit.instanceId === target.instanceId
          ? { ...unit, health: unit.health - attacker.attack }
          : unit,
      )
      .filter((unit) => unit.health > 0);
    return {
      ...state,
      playerBoard,
      enemyBoard,
      selectedAttackerId: null,
      logs: [log("player", `${attacker.name} 攻击了 ${target.name}。`), ...state.logs],
    };
  }

  if (action.type === "attack_hero") {
    if (!state.selectedAttackerId || state.turn !== "player") return state;
    const attacker = state.playerBoard.find((unit) => unit.instanceId === state.selectedAttackerId);
    if (!attacker?.canAttack) return state;
    return finish({
      ...state,
      enemyHealth: state.enemyHealth - attacker.attack,
      playerBoard: state.playerBoard.map((unit) =>
        unit.instanceId === attacker.instanceId ? { ...unit, canAttack: false } : unit,
      ),
      selectedAttackerId: null,
      logs: [log("player", `${attacker.name} 对敌方英雄造成 ${attacker.attack} 点伤害。`), ...state.logs],
    });
  }

  if (action.type === "end_turn") {
    if (state.turn !== "player") return state;
    return {
      ...state,
      turn: "enemy",
      phaseLabel: "敌方思考中",
      selectedAttackerId: null,
      selectedCardId: null,
      logs: [log("system", "你结束了回合。"), ...state.logs],
    };
  }

  if (action.type === "resolve_enemy_turn") {
    if (state.turn !== "enemy") return state;
    let playerHealth = state.playerHealth;
    let playerBoard = state.playerBoard.map((unit) => ({ ...unit }));
    const enemyBoard = state.enemyBoard.map((unit) => ({ ...unit, canAttack: false }));
    const roundLogs: BattleLog[] = [];

    enemyBoard.forEach((attacker) => {
      const target = playerBoard[0];
      if (target) {
        target.health -= attacker.attack;
        attacker.health -= target.attack;
        roundLogs.push(log("enemy", `${attacker.name} 攻击了 ${target.name}。`));
        playerBoard = playerBoard.filter((unit) => unit.health > 0);
      } else {
        playerHealth -= attacker.attack;
        roundLogs.push(log("enemy", `${attacker.name} 对你造成 ${attacker.attack} 点伤害。`));
      }
    });

    const nextMax = Math.min(10, state.maxEnergy + 1);
    const [drawn, ...deck] = state.deck;
    return finish({
      ...state,
      round: state.round + 1,
      turn: "player",
      phaseLabel: "你的行动",
      playerHealth,
      maxEnergy: nextMax,
      energy: nextMax,
      enemyEnergy: Math.min(10, state.enemyEnergy + 1),
      playerBoard: playerBoard.map((unit) => ({ ...unit, canAttack: true })),
      enemyBoard: enemyBoard.filter((unit) => unit.health > 0),
      hand: drawn ? [...state.hand, drawn] : state.hand,
      deck,
      logs: [
        log("system", `第 ${state.round + 1} 回合开始，你抽取了一张牌。`),
        ...roundLogs.reverse(),
        ...state.logs,
      ],
    });
  }

  return state;
}

function HealthBar({ value, max, enemy = false }: { value: number; max: number; enemy?: boolean }) {
  return (
    <div className="health-bar" aria-label={`生命值 ${value}/${max}`}>
      <span className={enemy ? "enemy-health" : "player-health"} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

function Hero({ enemy, health, maxHealth, selectedTarget, onClick }: { enemy?: boolean; health: number; maxHealth: number; selectedTarget?: boolean; onClick?: () => void }) {
  return (
    <button className={`hero ${enemy ? "enemy-hero" : "player-hero"} ${selectedTarget ? "targetable" : ""}`} onClick={onClick} aria-label={enemy ? "攻击敌方英雄" : "己方英雄"}>
      <div className="hero-portrait"><span>{enemy ? "魇" : "玄"}</span></div>
      <div className="hero-info">
        <strong>{enemy ? "夜魇祭司" : "玄霄剑主"}</strong>
        <small>{enemy ? "幽冥 · 控制" : "天衍 · 剑修"}</small>
        <HealthBar value={health} max={maxHealth} enemy={enemy} />
      </div>
      <div className="hero-health">{health}</div>
    </button>
  );
}

function BoardUnit({ unit, enemy, selected, targetable, onClick }: { unit: Unit; enemy?: boolean; selected?: boolean; targetable?: boolean; onClick: () => void }) {
  return (
    <button className={`board-unit element-${unit.element} ${selected ? "selected-unit" : ""} ${targetable ? "targetable-unit" : ""} ${!enemy && !unit.canAttack ? "spent" : ""}`} onClick={onClick}>
      <span className="unit-cost">{unit.cost}</span>
      <span className="unit-sigil">{unit.sigil}</span>
      <strong>{unit.name}</strong>
      <span className="unit-stats"><b>⚔ {unit.attack}</b><b>♥ {unit.health}</b></span>
    </button>
  );
}

function EmptySlots({ count, label }: { count: number; label: string }) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => (
    <div className="empty-slot" key={`${label}-${index}`}><span>◇</span></div>
  ));
}

function HandCard({ card, selected, playable, onSelect, onPlay }: { card: Card; selected: boolean; playable: boolean; onSelect: () => void; onPlay: () => void }) {
  return (
    <article
      className={`hand-card element-${card.element} ${selected ? "selected-card" : ""} ${!playable ? "disabled-card" : ""}`}
      draggable={playable}
      onDragStart={(event) => event.dataTransfer.setData("text/card-id", card.id)}
      onClick={onSelect}
      onDoubleClick={onPlay}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
    >
      <span className="card-cost">{card.cost}</span>
      <div className="card-art"><span>{card.sigil}</span><i /></div>
      <div className="card-copy">
        <strong>{card.name}</strong>
        <small>{card.kind === "unit" ? "灵兽单位" : "秘法"}</small>
        <p>{card.description}</p>
      </div>
      {card.kind === "unit" ? <div className="card-stats"><b>{card.attack}</b><b>{card.health}</b></div> : <div className="spell-mark">✦</div>}
    </article>
  );
}

export function GameClient() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [logOpen, setLogOpen] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    if (state.turn !== "enemy" || state.winner) return;
    const timer = window.setTimeout(() => dispatch({ type: "resolve_enemy_turn" }), 1100);
    return () => window.clearTimeout(timer);
  }, [state.turn, state.winner]);

  const selectedCard = state.hand.find((card) => card.id === state.selectedCardId);
  const canPlaySelected = selectedCard && selectedCard.cost <= state.energy;

  const playCard = (id: string) => dispatch({ type: "play_card", id });
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/card-id");
    if (id) playCard(id);
  };

  return (
    <main className="game-shell">
      <div className="mist mist-one" />
      <div className="mist mist-two" />
      <header className="topbar">
        <div className="brand"><span className="brand-mark">天</span><div><strong>天衍牌局</strong><small>TIANYAN CARD DUEL</small></div></div>
        <div className="round-indicator"><small>第</small><strong>{state.round}</strong><small>回合</small><span>·</span><b>{state.phaseLabel}</b></div>
        <div className="top-actions">
          <span className="connection"><i /> 本地演示</span>
          <button onClick={() => setSoundOn((value) => !value)} aria-label="切换声音">{soundOn ? "♫" : "♩"}</button>
          <button onClick={() => dispatch({ type: "restart" })} aria-label="重新开始">↻</button>
          <button aria-label="设置">⚙</button>
        </div>
      </header>

      <section className="battlefield">
        <div className="enemy-row">
          <Hero enemy health={state.enemyHealth} maxHealth={state.maxEnemyHealth} selectedTarget={Boolean(state.selectedAttackerId)} onClick={() => dispatch({ type: "attack_hero" })} />
          <div className="enemy-resources"><span>敌方手牌</span><b>▥ {4 + (state.round % 2)}</b><span>灵力 {state.enemyEnergy}/10</span></div>
        </div>

        <div className="board enemy-board">
          {state.enemyBoard.map((unit) => <BoardUnit key={unit.instanceId} unit={unit} enemy targetable={Boolean(state.selectedAttackerId)} onClick={() => dispatch({ type: "attack_unit", targetId: unit.instanceId })} />)}
          <EmptySlots count={MAX_BOARD - state.enemyBoard.length} label="enemy" />
        </div>

        <div className="battle-line"><span /><b>天衍战境</b><span /></div>

        <div className="board player-board" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => selectedCard && playCard(selectedCard.id)}>
          {state.playerBoard.map((unit) => <BoardUnit key={unit.instanceId} unit={unit} selected={unit.instanceId === state.selectedAttackerId} onClick={() => dispatch({ type: "select_attacker", id: unit.instanceId })} />)}
          <EmptySlots count={MAX_BOARD - state.playerBoard.length} label="player" />
          {selectedCard && <div className="drop-hint">点击空位或双击手牌出牌</div>}
        </div>

        <div className="player-row">
          <Hero health={state.playerHealth} maxHealth={state.maxPlayerHealth} />
          <div className="energy-panel"><div><strong>{state.energy}</strong><span>/ {state.maxEnergy}</span></div><small>灵力</small><div className="energy-pips">{Array.from({ length: state.maxEnergy }, (_, i) => <i key={i} className={i < state.energy ? "active" : ""} />)}</div></div>
          <button className="end-turn" disabled={state.turn !== "player"} onClick={() => dispatch({ type: "end_turn" })}><span>{state.turn === "player" ? "结束回合" : "等待敌方"}</span><small>END TURN</small></button>
        </div>
      </section>

      <aside className={`battle-log ${logOpen ? "open" : ""}`}>
        <button className="log-toggle" onClick={() => setLogOpen((value) => !value)}>{logOpen ? "战斗记录 ×" : "战斗记录"}</button>
        <div className="log-list">{state.logs.slice(0, 7).map((item) => <p className={item.tone} key={item.id}>{item.text}</p>)}</div>
      </aside>

      <section className="hand-area">
        <div className="deck-stack"><span>{state.deck.length}</span><small>牌库</small></div>
        <div className="hand-cards">
          {state.hand.map((card) => <HandCard key={card.id} card={card} selected={card.id === state.selectedCardId} playable={card.cost <= state.energy && state.turn === "player"} onSelect={() => dispatch({ type: "select_card", id: card.id })} onPlay={() => playCard(card.id)} />)}
        </div>
        <div className="hand-actions">
          <button disabled={!canPlaySelected} onClick={() => selectedCard && playCard(selectedCard.id)}>打出此牌</button>
          <small>{state.hand.length}/10 手牌</small>
        </div>
      </section>

      {state.winner && <div className="result-overlay"><div className="result-card"><small>对局结束</small><strong>{state.winner === "player" ? "天命所归" : "道心失守"}</strong><p>{state.winner === "player" ? "你击败了夜魇祭司。" : "重整牌组，再战幽冥。"}</p><button onClick={() => dispatch({ type: "restart" })}>再来一局</button></div></div>}
    </main>
  );
}
