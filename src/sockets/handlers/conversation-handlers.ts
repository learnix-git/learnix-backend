import type { Server, Socket } from "socket.io";
import { ConversationSchema } from "../../validations/chat-validations";
import { ChatService } from "../../services/chat-services";

export function ConversationHandlers(
  io: Server,
  socket: Socket
) {
  // Lắng nghe sự kiện tham gia cuộc trò chuyện
  socket.on(
    "conversation:join",
    async (
      raw,
      ack
    ) => {
      const parsed = ConversationSchema.safeParse(raw);

      if (!parsed.success) {
        return ack?.({
          ok: false,
          error: parsed.error.issues[0]?.message,
        });
      }

      try {
        // Kiểm tra quyền truy cập
        await ChatService.check_role(
          parsed.data.conversationId,
          socket.data.user.id
        );

        socket.join(`conversation:${parsed.data.conversationId}`);

        ack?.({
          ok: true,
        });
      } catch (error: any) {
        ack?.({
          ok: false,
          error: error.message,
        });
      }
    }
  );

  // Lắng nghe sự kiện rời khỏi cuộc trò chuyện
  socket.on(
    "conversation:leave",
    (raw) => {
      const parsed = ConversationSchema.safeParse(raw);

      if (!parsed.success) {
        return;
      }

      socket.leave(`conversation:${parsed.data.conversationId}`);
    }
  );
}