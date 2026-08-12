import type { ClientCommand, ServerEvent } from "./types";

export type GameTransport = {
  connect: (onEvent: (event: ServerEvent) => void) => void;
  send: (command: ClientCommand) => void;
  close: () => void;
};

export function createWebSocketTransport(url: string): GameTransport {
  let socket: WebSocket | null = null;
  let listener: ((event: ServerEvent) => void) | null = null;

  return {
    connect(onEvent) {
      listener = onEvent;
      socket = new WebSocket(url);
      socket.addEventListener("open", () =>
        listener?.({ type: "connection", status: "online" }),
      );
      socket.addEventListener("close", () =>
        listener?.({ type: "connection", status: "offline" }),
      );
      socket.addEventListener("message", (message) => {
        try {
          listener?.(JSON.parse(String(message.data)) as ServerEvent);
        } catch {
          listener?.({ type: "command_rejected", reason: "服务端消息格式无效" });
        }
      });
    },
    send(command) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(command));
      }
    },
    close() {
      socket?.close();
      socket = null;
    },
  };
}
