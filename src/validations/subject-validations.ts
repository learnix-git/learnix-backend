import { z } from "zod";

// Xác thực phân trang + tìm kiếm môn học
export const GetSubjectsSchema = z.object({
  page: z.coerce
    .number()
    .int("Page không hợp lệ")
    .min(1, "Page tối thiểu là 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit không hợp lệ")
    .min(1, "Limit tối thiểu là 1")
    .max(100, "Limit tối đa là 100")
    .default(50),

  search: z
    .string()
    .max(100, "Từ khoá tìm kiếm quá dài")
    .optional(),
});

export type GetSubjectsData = z.infer<typeof GetSubjectsSchema>;