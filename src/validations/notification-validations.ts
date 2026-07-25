import { z } from "zod";

// Xác thực phân trang danh sách thông báo
export const ListSchema = z.object({
  page: z.coerce.number().int("Page không hợp lệ").min(1, "Page tối thiểu là 1").default(1),
  limit: z.coerce
    .number()
    .int("Limit không hợp lệ")
    .min(1, "Limit tối thiểu là 1")
    .max(50, "Limit tối đa là 50")
    .default(20),
});

export type ListData = z.infer<typeof ListSchema>;

// Xác thực đánh dấu 1 thông báo đã đọc
export const ReadSchema = z.object({
  id: z.string().min(1, "Thiếu id thông báo"),
});

export type ReadData = z.infer<typeof ReadSchema>;