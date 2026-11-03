# 天衍牌局客户端 Demo

服务端权威的双人卡牌对战客户端第一版。客户端只负责匹配、操作输入和界面展示；出牌、伤害、抽牌、回合与胜负均由 Erlang 房间进程结算后，通过个性化 `snapshot` 返回。

## 本地运行

要求 Node.js 22.13 或更高版本。在 Codex 桌面环境中，启动脚本会自动使用随应用安装的兼容 Node.js；其他环境请自行安装兼容版本，或通过 `CARD_GAME_NODE` 指定 Node.js 可执行文件。

复制 `.env.example` 为 `.env.local`，按需修改 Erlang WebSocket 地址：

```bash
NEXT_PUBLIC_GAME_WS_URL=ws://127.0.0.1:18080/ws
npm install
npm run dev
```

打开两个浏览器标签页或窗口，分别输入称号并加入匹配。客户端为每个标签页生成独立玩家 ID，两个客户端必须连接到同一个 Erlang 匹配服务。

## 客户端职责

- WebSocket 连接状态、匹配大厅和等待界面
- 发送带 `commandId` 的操作意图
- 使用 `version` 忽略过期快照
- 在服务端确认前锁定重复操作
- 只展示服务端下发的己方手牌、双方战场及公开数据
- 本地只保留卡牌选择、攻击者选择、日志开关和声音开关等 UI 状态

客户端不会自行扣除灵力、计算伤害、抽牌或判断胜负。

## 第一版协议

加入匹配：

```json
{"type":"join_queue","playerId":"player-a","playerName":"青霄剑客"}
```

服务端确认匹配：

```json
{"type":"matched","roomId":"room-12","seat":"player_one"}
```

服务端需要为每个座位生成个性化快照：

```json
{
  "type": "snapshot",
  "acknowledgedCommandId": "cmd-101",
  "state": {
    "roomId": "room-12",
    "version": 7,
    "round": 3,
    "mySeat": "player_one",
    "activeSeat": "player_one",
    "phase": "playing",
    "phaseLabel": "你的行动",
    "self": {
      "id": "player-a",
      "name": "青霄剑客",
      "health": 24,
      "maxHealth": 30,
      "energy": 5,
      "maxEnergy": 5,
      "board": [],
      "hand": [],
      "handCount": 5,
      "deckCount": 17,
      "connected": true
    },
    "opponent": {
      "id": "player-b",
      "name": "夜魇祭司",
      "health": 20,
      "maxHealth": 30,
      "energy": 4,
      "maxEnergy": 4,
      "board": [],
      "handCount": 5,
      "deckCount": 18,
      "connected": true
    },
    "logs": [],
    "winner": null
  }
}
```

对方视角中不要发送 `opponent.hand`。完整 TypeScript 契约位于 `app/game/types.ts`。

游戏命令示例：

```json
{"type":"play_card","commandId":"cmd-101","cardId":"ember-fox-0"}
{"type":"attack_unit","commandId":"cmd-102","attackerId":"unit-1","targetId":"unit-8"}
{"type":"attack_hero","commandId":"cmd-103","attackerId":"unit-1"}
{"type":"end_turn","commandId":"cmd-104"}
{"type":"surrender","commandId":"cmd-105"}
```

非法命令返回：

```json
{"type":"command_rejected","commandId":"cmd-104","reason":"当前不是你的回合"}
```

## Erlang 服务端

仓库中的 `server/` 已实现上述双人协议，包括公共匹配、房间码匹配、双座位房间、个性化快照、命令幂等、投降、再战和 30 秒断线重连。启动方式见 [`server/README.md`](server/README.md)。
