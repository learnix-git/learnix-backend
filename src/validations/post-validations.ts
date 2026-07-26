import { z } from "zod";

// Xác thực phân trang + filter danh sách bài đăng
export const GetPostsSchema = z.object({
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

  topic: z.string().optional(),

  level: z
    .enum(["PRIMARY", "MIDDLE", "HIGH", "ALL"])
    .optional(),

  grade: z.coerce
    .number()
    .int("Khối lớp không hợp lệ")
    .optional(),

  mode: z
    .enum(["ONLINE", "OFFLINE"])
    .optional(),

  city: z.string().optional(),
  district: z.string().optional(),

  minPrice: z.coerce
    .number()
    .min(0, "Giá không hợp lệ")
    .optional(),

  maxPrice: z.coerce
    .number()
    .min(0, "Giá không hợp lệ")
    .optional(),
});

export type GetPostsData = z.infer<typeof GetPostsSchema>;

// Schema gốc dùng chung cho tạo/sửa bài đăng
const PostBaseSchema = z.object({
  topics: z
    .array(
      z.union([
        z.object({ subject: z.string().min(1) }),
        z.object({ custom: z.string().min(1).max(100) }),
      ])
    )
    .min(1, "Vui lòng chọn ít nhất 1 môn dạy"),

  title: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(150, "Tiêu đề quá dài"),

  content: z
    .string()
    .min(1, "Vui lòng nhập nội dung")
    .max(5000, "Nội dung tối đa 5000 ký tự"),

  level: z
    .enum(["PRIMARY", "MIDDLE", "HIGH", "ALL"])
    .optional()
    .default("ALL"),

  grade: z
    .number()
    .int("Khối lớp không hợp lệ")
    .min(1, "Khối lớp không hợp lệ")
    .max(12, "Khối lớp không hợp lệ"),

  mode: z.enum(["ONLINE", "OFFLINE"]),

  venue: z.enum(["TUTOR", "STUDENT", "BOTH"]).optional(),

  city: z
    .string()
    .max(100, "Tên tỉnh/thành quá dài")
    .optional(),

  district: z
    .string()
    .max(100, "Tên quận/huyện quá dài")
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
    .min(1000, "Giá tối thiểu 1.000đ"),

  to: z
    .number()
    .min(1000, "Giá tối thiểu 1.000đ"),
});

// Xác thực tạo bài đăng
export const CreatePostSchema = PostBaseSchema
  .refine((data) => data.to >= data.from, {
    message: "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu!",
    path: ["to"],
  })
  .refine((data) => data.mode !== "OFFLINE" || data.venue !== undefined, {
    message: "Vui lòng chọn địa điểm dạy khi chọn hình thức Offline",
    path: ["venue"],
  })
  .refine(
    (data) => !(data.mode === "OFFLINE" && data.venue === "TUTOR") || !!data.city?.trim(),
    { message: "Vui lòng nhập khu vực dạy", path: ["city"] }
  );

export type CreatePostData = z.infer<typeof CreatePostSchema>;

// Xác thực sửa bài đăng
export const UpdatePostSchema = PostBaseSchema
  .partial()
  .extend({
    status: z
      .enum(["OPEN", "DONE", "CANCEL", "HOLD"])
      .optional(),
  })
  .refine(
    (data) =>
      data.from === undefined ||
      data.to === undefined ||
      data.to >= data.from,
    {
      message: "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu!",
      path: ["to"],
    }
  );

export type UpdatePostData = z.infer<typeof UpdatePostSchema>;