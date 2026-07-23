import { z } from 'zod';

// ! Danh sách thông báo — phân trang
export const ListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// ! Đánh dấu 1 thông báo đã đọc — id = Notification.id (cũng là "target id")
export const ReadSchema = z.object({
  id: z.string().min(1, "Thiếu id thông báo"),
});

// ! Đánh dấu cả nhóm (groupable, vd post_bid) đã đọc
export const ReadGroupSchema = z.object({
  groupKey: z.string().min(1, "Thiếu groupKey"),
});