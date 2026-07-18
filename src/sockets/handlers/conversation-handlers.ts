import type { Server, Socket } from "socket.io";
import { ConversationSchema } from "../../validations/chat-validations";
import { ChatService } from "../../services/chat-services";

export function registerConversationHandlers(io: Server, socket: Socket) {
  socket.on("conversation:join", async (raw, ack) => {
    const parsed = ConversationSchema.safeParse(raw);
    if (!parsed.success) return ack?.({ ok: false, error: parsed.error.issues[0]?.message });

    try {
      await ChatService.check_role(parsed.data.conversationId, socket.data.user.id);
      socket.join(`conversation:${parsed.data.conversationId}`);
      ack?.({ ok: true });
    } catch (error: any) {
      ack?.({ ok: false, error: error.message });
    }
  });

  socket.on("conversation:leave", (raw) => {
    const parsed = ConversationSchema.safeParse(raw);
    if (!parsed.success) return;
    socket.leave(`conversation:${parsed.data.conversationId}`);
  });
}