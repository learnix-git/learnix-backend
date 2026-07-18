import type { Server, Socket } from "socket.io";
import { ConversationSchema } from "../../validations/chat-validations";

export function registerTypingHandlers(io: Server, socket: Socket) {
  const emit = (conversationId: string, typing: boolean) => {
    socket.to(`conversation:${conversationId}`).emit("typing:update", {
      conversationId, userId: socket.data.user.id, typing,
    });
  };

  socket.on("typing:start", (raw) => {
    const p = ConversationSchema.safeParse(raw);
    if (p.success) emit(p.data.conversationId, true);
  });

  socket.on("typing:stop", (raw) => {
    const p = ConversationSchema.safeParse(raw);
    if (p.success) emit(p.data.conversationId, false);
  });
}