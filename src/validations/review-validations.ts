import { z } from "zod";

// Xác thực danh sách review
export const GetReviewsSchema = z.object({
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

export type GetReviewsData = z.infer<typeof GetReviewsSchema>;

// Xác thực tạo review
export const CreateReviewSchema = z.object({
  contractId: z
    .string()
    .min(1, "Thiếu contractId"),

  rating: z
    .number()
    .int("Số sao không hợp lệ")
    .min(1, "Tối thiểu 1 sao")
    .max(5, "Tối đa 5 sao"),

  content: z
    .string()
    .max(1000, "Nội dung tối đa 1000 ký tự")
    .optional(),
});

export type CreateReviewData = z.infer<typeof CreateReviewSchema>;