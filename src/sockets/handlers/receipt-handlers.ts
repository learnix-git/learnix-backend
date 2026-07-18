import type { Server, Socket } from "socket.io";
import { MarkReadSchema } from "../../validations/chat-validations";
import { ChatService } from "../../services/chat-services";

export function registerReceiptHandlers(io: Server, socket: Socket) {
  socket.on("message:read", async (raw, ack) => {
    const parsed = MarkReadSchema.safeParse(raw);
    if (!parsed.success) return ack?.({ ok: false, error: parsed.error.issues[0]?.message });

    const { conversationId, messageId } = parsed.data;
    try {
      await ChatService.mark_as_read(conversationId, socket.data.user.id, messageId);
      io.to(`conversation:${conversationId}`).emit("message:read", {
        conversationId,
        readerId: socket.data.user.id,
        messageId,
        readAt: new Date().toISOString(),
      });
      ack?.({ ok: true });
    } catch (error: any) {
      ack?.({ ok: false, error: error.message });
    }
  });
}