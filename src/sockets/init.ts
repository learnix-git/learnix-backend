import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { ConversationHandlers } from "./handlers/conversation-handlers";
import { MessageHandlers } from "./handlers/message-handlers";
import { ReceiptHandlers } from "./handlers/receipt-handlers";
import { TypingHandlers } from "./handlers/typing-handlers";
import { PresenceHandlers } from "./handlers/presence-handlers";

let ioInstance: Server | undefined;

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error(
      "Socket.io chưa được khởi tạo"
    );
  }

  return ioInstance;
}

export function initSocket(
  httpServer: HttpServer
) {
  const io = new Server(
    httpServer,
    {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
        credentials: true,
      },
    }
  );

  ioInstance = io;

  io.use(socketAuth);

  io.on(
    "connection",
    (socket) => {
      const userId = socket.data.user?.id;

      if (userId) {
        socket.join(`user:${userId}`);
      }

      PresenceHandlers(
        io,
        socket
      );
      ConversationHandlers(
        io,
        socket
      );
      MessageHandlers(
        io,
        socket
      );
      ReceiptHandlers(
        io,
        socket
      );
      TypingHandlers(
        io,
        socket
      );
    }
  );

  return io;
}