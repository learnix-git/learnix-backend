import { z } from "zod";

// Xác thực phân trang danh sách follow
export const GetFollowsSchema = z.object({
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

export type GetFollowsData = z.infer<typeof GetFollowsSchema>;

// Xác thực follow tutor
export const CreateFollowSchema = z.object({
  tutorId: z
    .string()
    .min(1, "Thiếu tutorId"),
});

export type CreateFollowData = z.infer<typeof CreateFollowSchema>;