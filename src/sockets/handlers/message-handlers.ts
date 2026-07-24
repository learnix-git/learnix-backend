import type { Server, Socket } from "socket.io";
import { SocketSchema } from "../../validations/chat-validations";
import { ChatService } from "../../services/chat-services";

export function MessageHandlers(
  io: Server,
  socket: Socket
) {
  // Lắng nghe sự kiện gửi tin nhắn
  socket.on(
    "message:send",
    async (
      raw,
      ack
    ) => {
      const parsed = SocketSchema.safeParse(raw);

      if (!parsed.success) {
        return ack?.({
          ok: false,
          error: parsed.error.issues[0]?.message,
        });
      }

      const {
        conversationId,
        ...payload
      } = parsed.data;

      try {
        const message = await ChatService.post_message(
          conversationId,
          socket.data.user.id,
          payload as any
        );

        io.to(`conversation:${conversationId}`).emit(
          "message:new",
          {
            messageId: message.id,
            conversationId: message.room,
            senderId: message.user.id,
            senderName: message.user.name,
            kind: message.kind,
            content: message.content,
            attachmentId: message.attachment?.id ?? null,
            createdAt: message.created,
          }
        );

        ack?.({
          ok: true,
          messageId: message.id,
        });
      } catch (error: any) {
        ack?.({
          ok: false,
          error: error.message || "Gửi tin nhắn thất bại",
        });
      }
    }
  );
}