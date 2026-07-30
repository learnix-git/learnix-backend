import { z } from "zod";

// Xác thực phân trang + filter danh sách yêu cầu
export const GetRequestsSchema = z.object({
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

  topics: z.any().optional(),

  level: z
    .enum(["PRIMARY", "MIDDLE", "HIGH", "ALL"])
    .optional(),

  grades: z.any().optional(),

  mode: z
    .enum(["ONLINE", "OFFLINE"])
    .optional(),

  city: z.string().optional(),

  minBudget: z.coerce
    .number()
    .min(0, "Ngân sách không hợp lệ")
    .optional(),

  maxBudget: z.coerce
    .number()
    .min(0, "Ngân sách không hợp lệ")
    .optional(),

  type: z.enum(["match", "all"]).optional(),
});

export type GetRequestsData = z.infer<typeof GetRequestsSchema>;

// Xác thực tạo yêu cầu
export const CreateRequestSchema = z.object({
  topics: z
    .array(
      z.object({
        subject: z.string().optional(),
        custom: z.string().optional(),
      })
    )
    .min(1, "Vui lòng chọn ít nhất 1 môn học"),

  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(150, "Tiêu đề quá dài"),

  desc: z
    .string()
    .min(1, "Vui lòng nhập mô tả")
    .max(5000, "Mô tả tối đa 5000 ký tự"),

  level: z
    .enum(["PRIMARY", "MIDDLE", "HIGH", "ALL"])
    .optional()
    .default("ALL"),

  grades: z
    .array(z.number().int().min(1).max(12))
    .min(1, "Vui lòng chọn ít nhất 1 khối lớp"),

  mode: z.enum(["ONLINE", "OFFLINE"]),

  city: z
    .string()
    .max(100, "Tên tỉnh/thành quá dài")
    .optional(),

  ward: z
    .string()
    .max(100, "Tên phường/xã quá dài")
    .optional(),

  street: z
    .string()
    .max(255, "Địa chỉ quá dài")
    .optional(),

  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional(),

  from: z
    .number()
    .min(1000, "Mức giá tối thiểu 1.000đ"),

  to: z
    .number()
    .min(1000, "Mức giá tối thiểu 1.000đ"),

  unit: z
    .enum(["PER_SESSION", "PER_MONTH"]),

  count: z
    .number()
    .int("Số buổi không hợp lệ")
    .min(1, "Số buổi tối thiểu là 1")
    .optional()
    .default(1),

  schedule: z
    .string()
    .max(255, "Lịch học quá dài")
    .optional(),

  venue: z
    .enum(["STUDENT", "TUTOR", "BOTH"])
    .optional(),

  flexible: z
    .boolean()
    .optional(),

  days: z
    .array(z.number().int().min(2).max(8))
    .optional(),

  slot: z
    .enum(["MORNING", "AFTERNOON", "EVENING"])
    .optional(),

  startTime: z
    .string()
    .optional(),

  endTime: z
    .string()
    .optional(),
});

export type CreateRequestData = z.infer<typeof CreateRequestSchema>;

// Xác thực sửa yêu cầu
export const UpdateRequestSchema = CreateRequestSchema
  .partial()
  .extend({
    status: z
      .enum(["OPEN", "DONE", "CANCEL", "HOLD"])
      .optional(),
  });

export type UpdateRequestData = z.infer<typeof UpdateRequestSchema>;