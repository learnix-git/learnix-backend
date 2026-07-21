import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { registerConversationHandlers } from "./handlers/conversation-handlers";
import { registerMessageHandlers } from "./handlers/message-handlers";
import { registerReceiptHandlers } from "./handlers/receipt-handlers";
import { registerTypingHandlers } from "./handlers/typing-handlers";
import { registerPresenceHandlers } from "./handlers/presence-handlers";

let ioInstance: Server | undefined;

export function getIO(): Server {
  if (!ioInstance) throw new Error("Socket.io chưa được khởi tạo");
  return ioInstance;
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerReceiptHandlers(io, socket);
    registerTypingHandlers(io, socket);
  });

  return io;
}