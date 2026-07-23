import { Request, Response } from 'express';
import { NotificationService } from '../services/notification-services';
import { ListSchema, ReadSchema, ReadGroupSchema } from '../validations/notification-validations';

export class NotificationController {
  // ! Danh sách thông báo (phân trang) — response khớp ApiResponse<NotificationItem[]> + unreadCount
  static async list(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { page, limit } = ListSchema.parse(req.body);

      const { items, total, unreadCount } = await NotificationService.list(userId, page, limit);

      res.status(200).json({
        code: 200,
        message: "OK",
        data: items,
        pagination: {
          items: total,
          pages: Math.max(1, Math.ceil(total / limit)),
          current: page,
          limit,
        },
        unreadCount,
      });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể tải thông báo!" });
    }
  }

  // ! Đánh dấu 1 thông báo (non-group) đã đọc
  static async read(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { id } = ReadSchema.parse(req.body);

      const updated = await NotificationService.mark_read(userId, id);
      res.status(200).json({ code: 200, message: "Đã đánh dấu đã đọc", updated });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể đánh dấu đã đọc!" });
    }
  }

  // ! Đánh dấu cả nhóm (groupKey) đã đọc — dùng cho post_bid
  static async readGroup(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const { groupKey } = ReadGroupSchema.parse(req.body);

      const updated = await NotificationService.mark_read_group(userId, groupKey);
      res.status(200).json({ code: 200, message: "Đã đánh dấu nhóm đã đọc", updated });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể đánh dấu đã đọc!" });
    }
  }

  // ! Đánh dấu tất cả đã đọc
  static async readAll(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const updated = await NotificationService.mark_read_all(userId);
      res.status(200).json({ code: 200, message: "Đã đánh dấu tất cả đã đọc", updated });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || "Không thể đánh dấu tất cả đã đọc!" });
    }
  }
}