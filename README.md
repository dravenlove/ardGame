# 天衍牌局客户端 Demo

独立的中文卡牌对战客户端原型。当前默认运行完整的本地规则模拟，方便先确认手感与界面；`app/game/transport.ts` 提供了可替换的 WebSocket 传输层，后续可接入 Erlang/OTP 服务端。

## 本地运行

要求 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

## 已实现

- 单位牌、法术牌、灵力与抽牌
- 点击或拖放出牌
- 单位互攻、攻击英雄、敌方自动回合
- 胜负判定、战斗记录、响应式布局
- 与界面状态解耦的 WebSocket 消息接口

## Erlang 接入约定

客户端命令采用 JSON 文本帧：

```json
{"type":"play_card","cardId":"ember-fox-0"}
{"type":"attack_unit","attackerId":"...","targetId":"..."}
{"type":"attack_hero","attackerId":"..."}
{"type":"end_turn"}
```

推荐服务端作为唯一权威状态源，处理命令后下发：

```json
{"type":"snapshot","state":{"round":4}}
```

完整 TypeScript 数据结构位于 `app/game/types.ts`。接入时用 `createWebSocketTransport()` 替换当前组件内的本地 reducer，并通过 `NEXT_PUBLIC_GAME_WS_URL` 或运行时配置传入网关地址。不要在浏览器变量中放服务端密钥。
