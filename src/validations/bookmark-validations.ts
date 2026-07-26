import { z } from "zod";

// Xác thực phân trang danh sách bookmark
export const GetBookmarksSchema = z.object({
  page: z.coerce
    .number()
    .int("Page không hợp lệ")
    .min(1, "Page tối thiểu là 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit không hợp lệ")
    .min(1, "Limit tối thiểu là 1")
    .max(50, "Limit tối đa là 50")
    .default(20),
});

export type GetBookmarksData = z.infer<typeof GetBookmarksSchema>;

// Xác thực bookmark request
export const CreateBookmarkSchema = z.object({
  requestId: z
    .string()
    .min(1, "Thiếu requestId"),
});

export type CreateBookmarkData = z.infer<typeof CreateBookmarkSchema>;