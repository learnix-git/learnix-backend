import { Request, Response } from 'express';
import { ChatService } from '../services/chat-services';
import {
  MessageSchema,
  MarkReadSchema,
  MessagesSchema,
  FilterSchema,
  OnlineSchema,
  UpsertSchema,
  TypingSchema,
} from '../validations/chat-validations';
import { checkOnline } from '../sockets/handlers/presence-handlers';
import { getIO } from '../sockets/init';

export class ChatController {
  // ! Tạo hoặc lấy lại cuộc trò chuyện
  static async upsert(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { peerId, courseId } = UpsertSchema.parse(req.body);

      const conversation = await ChatService.upsert_conversation(userId, peerId, courseId);
      res.status(200).json({ code: 200, conversation });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể tạo cuộc trò chuyện!" });
    }
  }

  // ! Danh sách cuộc trò chuyện
  static async list(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { type } = FilterSchema.parse(req.body);

      const items = await ChatService.get_conversations(userId, type);
      res.status(200).json({ code: 200, total: items.length, items });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể lấy danh sách cuộc trò chuyện!" });
    }
  }

  // ! Tin nhắn phân trang
  static async messages(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { conversationId, page, limit } = MessagesSchema.parse(req.body);

      const { items, total } = await ChatService.get_messages(conversationId, userId, page, limit);
      res.status(200).json({ code: 200, total, items });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể tải tin nhắn!" });
    }
  }

  // ! Gửi tin nhắn
  static async send(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { conversationId, ...payload } = req.body;
      if (!conversationId || typeof conversationId !== "string") {
        return res.status(400).json({ code: 400, message: "Thiếu conversationId" });
      }
      const validated = MessageSchema.parse(payload);
      const message = await ChatService.post_message(conversationId, userId, validated as any);

      getIO().to(`conversation:${conversationId}`).emit("message:new", {
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.sender.id,
        senderName: message.sender.name,
        type: message.type,
        content: message.content,
        attachmentId: message.attachment?.id ?? null,
        createdAt: message.createdAt,
      });

      res.status(200).json({ code: 200, message });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Gửi tin nhắn thất bại!" });
    }
  }

  // ! Đánh dấu đã đọc
  static async read(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { conversationId, messageId } = MarkReadSchema.parse(req.body);

      await ChatService.mark_as_read(conversationId, userId, messageId);
      res.status(200).json({ code: 200, updated: 1, messageId });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể đánh dấu đã đọc!" });
    }
  }

  // ! Trạng thái đang gõ qua REST
  static async typing(req: Request, res: Response) {
    try {
      const { conversationId, typing } = TypingSchema.parse(req.body);
      res.status(200).json({ code: 200, conversationId, typing });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể cập nhật trạng thái gõ!" });
    }
  }

  // ! Kiểm tra userId nào đang online
  static async online(req: Request, res: Response) {
    try {
    const { userIds } = OnlineSchema.parse(req.body);
      res.status(200).json({ code: 200, online: checkOnline(userIds) });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message });
    }
  }

  // ! Upload file đính kèm (multer memoryStorage -> buffer -> Cloudinary)
  static async upload(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ code: 400, message: "Vui lòng chọn file để tải lên!" });
      }

      const result = await ChatService.upload_attachment(userId, {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      res.status(200).json({ code: 200, ...result });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Tải file thất bại!" });
    }
  }

  // ! Tổng số tin nhắn chưa đọc
  static async unread(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { total, items } = await ChatService.count_unread(userId);
      res.status(200).json({ code: 200, total, items });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể đếm tin nhắn chưa đọc!" });
    }
  }
}