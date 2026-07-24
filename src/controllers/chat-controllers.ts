import { Request, Response } from 'express';
import { ChatService } from '../services/chat-services';
import { 
  SocketSchema, 
  MarkReadSchema, 
  MessagesSchema, 
  OnlineSchema, 
  UpsertSchema, 
  TypingSchema 
} from '../validations/chat-validations';
import { checkOnline } from '../sockets/handlers/presence-handlers';
import { getIO } from '../sockets/init';

export class ChatController {
  // Hàm tạo cuộc trò chuyện
  static async upsert(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const { peerId } = UpsertSchema.parse(req.body);

      const conversation = await ChatService.upsert_conversation(
        userId,
        peerId
      );

      res.status(200).json({
        code: 200,
        conversation,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể tạo cuộc trò chuyện!",
      });
    }
  }

  // Hàm lấy danh sách cuộc trò chuyện
  static async list(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const items = await ChatService.get_conversations(userId);

      res.status(200).json({
        code: 200,
        total: items.length,
        items,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách cuộc trò chuyện!",
      });
    }
  }

  // Hàm lấy danh sách tin nhắn trong cuộc trò chuyện
  static async messages(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const {
        conversationId,
        page,
        limit,
      } = MessagesSchema.parse(req.body);

      const {
        items,
        total,
      } = await ChatService.get_messages(
        conversationId,
        userId,
        page,
        limit
      );

      res.status(200).json({
        code: 200,
        total,
        items,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể tải tin nhắn!",
      });
    }
  }

  // Hàm gửi tin nhắn
  static async send(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const {
        conversationId,
        ...payload
      } = SocketSchema.parse(req.body);

      const message = await ChatService.post_message(
        conversationId,
        userId,
        payload as any
      );

      // Gọi socket
      getIO()
        .to(`conversation:${conversationId}`)
        .emit("message:new", {
          messageId: message.id,
          conversationId: message.room,
          senderId: message.user.id,
          senderName: message.user.name,
          kind: message.kind,
          content: message.content,
          attachmentId: message.attachment?.id ?? null,
          createdAt: message.created,
        });

      res.status(200).json({
        code: 200,
        message,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Gửi tin nhắn thất bại!",
      });
    }
  }

  // Hàm đánh dấu đã đọc
  static async read(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const {
        conversationId,
        messageId,
      } = MarkReadSchema.parse(req.body);

      await ChatService.mark_as_read(
        conversationId,
        userId,
        messageId
      );

      // Gọi socket
      getIO()
        .to(`conversation:${conversationId}`)
        .emit("message:read", {
          conversationId,
          readerId: userId,
          messageId,
          readAt: new Date().toISOString(),
        });

      res.status(200).json({
        code: 200,
        updated: 1,
        messageId,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đánh dấu đã đọc!",
      });
    }
  }

  // Hàm hiển thị trạng thái đang gõ
  static async typing(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const {
        conversationId,
        typing,
      } = TypingSchema.parse(req.body);

      // Gọi socket
      getIO()
        .to(`conversation:${conversationId}`)
        .emit("typing:update", {
          conversationId,
          userId,
          typing,
        });

      res.status(200).json({
        code: 200,
        conversationId,
        typing,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể cập nhật trạng thái gõ!",
      });
    }
  }

  // Hàm hiển thị trạng thái hoạt động
  static async online(
    req: Request,
    res: Response
  ) {
    try {
      const { userIds } = OnlineSchema.parse(req.body);

      res.status(200).json({
        code: 200,
        online: checkOnline(userIds),
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message,
      });
    }
  }

  // Hàm đăng tải tệp
  static async upload(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Lấy file từ request
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          code: 400,
          message: "Vui lòng chọn file để tải lên!",
        });
      }

      const result = await ChatService.upload_attachment(
        userId,
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        }
      );

      res.status(200).json({
        code: 200,
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Tải file thất bại!",
      });
    }
  }

  // Hàm đếm tin nhắn chưa đọc
  static async unread(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      
      const {
        total,
        items,
      } = await ChatService.count_unread(userId);

      res.status(200).json({
        code: 200,
        total,
        items,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đếm tin nhắn chưa đọc!",
      });
    }
  }
}