import { z } from "zod";

// Xác thực thêm môn dạy
export const CreateSkillSchema = z.object({
  topic: z
    .string()
    .min(1, "Thiếu môn học"),

  grades: z
    .array(
      z.number().int()
    )
    .min(1, "Vui lòng chọn ít nhất 1 khối lớp"),
});

export type CreateSkillData = z.infer<typeof CreateSkillSchema>;


// Xác thực thêm bằng cấp
export const CreateDegreeSchema = z.object({
  name: z
    .string()
    .min(1, "Vui lòng nhập tên bằng cấp")
    .max(150, "Tên bằng cấp quá dài"),

  type: z
    .string()
    .min(1, "Vui lòng nhập loại bằng cấp")
    .max(100, "Loại bằng cấp quá dài"),

  score: z
    .string()
    .max(50, "Điểm số quá dài")
    .optional(),

  issuer: z
    .string()
    .max(150, "Tên đơn vị cấp quá dài")
    .optional(),

  year: z
    .coerce
    .number()
    .int("Năm cấp không hợp lệ")
    .min(1950, "Năm cấp không hợp lệ")
    .max(new Date().getFullYear(), "Năm cấp không hợp lệ")
    .optional(),
});

export type CreateDegreeData = z.infer<typeof CreateDegreeSchema>;


// Xác thực thêm kinh nghiệm
export const CreateHistorySchema = z.object({
  title: z
    .string()
    .min(1, "Vui lòng nhập chức danh")
    .max(150, "Chức danh quá dài"),

  place: z
    .string()
    .min(1, "Vui lòng nhập nơi làm việc")
    .max(150, "Nơi làm việc quá dài"),

  start: z
    .number()
    .int("Năm bắt đầu không hợp lệ")
    .min(1950, "Năm bắt đầu không hợp lệ")
    .max(new Date().getFullYear(), "Năm bắt đầu không hợp lệ"),

  end: z
    .number()
    .int("Năm kết thúc không hợp lệ")
    .min(1950, "Năm kết thúc không hợp lệ")
    .optional(),

  desc: z
    .string()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .optional(),
});

export type CreateHistoryData = z.infer<typeof CreateHistorySchema>;


// Xác thực sửa kinh nghiệm
export const UpdateHistorySchema =
  CreateHistorySchema.partial();

export type UpdateHistoryData = z.infer<typeof UpdateHistorySchema>;


// Xác thực cập nhật lịch dạy
export const UpdateScheduleSchema = z.object({
  slots: z
    .array(
      z.object({
        day: z
          .number()
          .int()
          .min(0, "Thứ không hợp lệ")
          .max(6, "Thứ không hợp lệ"),

        start: z
          .string()
          .min(1, "Thiếu giờ bắt đầu"),

        end: z
          .string()
          .min(1, "Thiếu giờ kết thúc"),

        active: z
          .boolean()
          .optional()
          .default(true),
      })
    )
    .max(50, "Số lượng khung giờ quá nhiều"),
});

export type UpdateScheduleData = z.infer<typeof UpdateScheduleSchema>;