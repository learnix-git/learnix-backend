import type { Server, Socket } from "socket.io";
import { ConversationSchema } from "../../validations/chat-validations";

export function TypingHandlers(
  io: Server,
  socket: Socket
) {
  const emit = (
    conversationId: string,
    typing: boolean
  ) => {
    socket
      .to(`conversation:${conversationId}`)
      .emit(
        "typing:update",
        {
          conversationId,
          userId: socket.data.user.id,
          typing,
        }
      );
  };

  // Lắng nghe sự kiện đang gõ
  socket.on(
    "typing:start",
    (raw) => {
      const p = ConversationSchema.safeParse(raw);

      if (p.success) {
        emit(
          p.data.conversationId,
          true
        );
      }
    }
  );

  // Lắng nghe sự kiện dừng gõ
  socket.on(
    "typing:stop",
    (raw) => {
      const p = ConversationSchema.safeParse(raw);

      if (p.success) {
        emit(
          p.data.conversationId,
          false
        );
      }
    }
  );
}