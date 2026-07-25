import { Request, Response } from 'express';
import { NotificationService } from '../services/notification-services';
import { ListSchema, ReadSchema } from '../validations/notification-validations';

export class NotificationController {
  // Hàm lấy danh sách thông báo
  static async list(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const { page, limit } = ListSchema.parse(req.body);

      const {
        items,
        total,
        unreadCount,
      } = await NotificationService.list(userId, page, limit);

      res.status(200).json({
        code: 200,
        total,
        unreadCount,
        items,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể tải thông báo!",
      });
    }
  }

  // Hàm đánh dấu 1 thông báo đã đọc
  static async read(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const { id } = ReadSchema.parse(req.body);

      const updated = await NotificationService.mark_read(userId, id);

      res.status(200).json({
        code: 200,
        updated,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đánh dấu đã đọc!",
      });
    }
  }

  // Hàm đánh dấu tất cả thông báo đã đọc
  static async readAll(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const updated = await NotificationService.mark_read_all(userId);

      res.status(200).json({
        code: 200,
        updated,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đánh dấu tất cả đã đọc!",
      });
    }
  }
}