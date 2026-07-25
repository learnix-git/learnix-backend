import { z } from "zod";

// Trường dữ liệu chung
const BankField = z.string().min(1, "Thiếu bankId");

// Xác thực cập nhật thông tin
export const UpdateInfoSchema = z.object({
  name: z
    .string()
    .min(1, "Họ tên không được để trống")
    .max(100, "Họ tên quá dài")
    .optional(),

  alias: z
    .string()
    .max(50, "Biệt danh quá dài")
    .optional(),

  gender: z
    .enum(["MALE", "FEMALE", "OTHER"])
    .optional(),

  dob: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Ngày sinh không hợp lệ"
    )
    .refine(
      (val) => {
        if (!val) return true;

        const age =
          (Date.now() - new Date(val).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25);

        return age >= 6 && age <= 100;
      },
      "Ngày sinh không hợp lệ"
    ),

  phone: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || /^(0|\+84)([35789])[0-9]{8}$/.test(val),
      "Số điện thoại không hợp lệ"
    ),

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
    .min(-90, "Vĩ độ không hợp lệ")
    .max(90, "Vĩ độ không hợp lệ")
    .optional(),

  lng: z
    .number()
    .min(-180, "Kinh độ không hợp lệ")
    .max(180, "Kinh độ không hợp lệ")
    .optional(),

  bio: z
    .string()
    .max(2000, "Giới thiệu tối đa 2000 ký tự")
    .optional(),

  level: z
    .string()
    .max(100, "Trình độ quá dài")
    .optional(),

  major: z
    .string()
    .max(100, "Chuyên ngành quá dài")
    .optional(),

  school: z
    .string()
    .max(150, "Tên trường quá dài")
    .optional(),
});

export type UpdateInfoData = z.infer<typeof UpdateInfoSchema>;

// Xác thực cập nhật avatar
export const UpdateAvatarSchema = z.object({
  url: z
    .string()
    .min(1, "Thiếu url avatar")
    .url("Url avatar không hợp lệ"),
});

export type UpdateAvatarData = z.infer<typeof UpdateAvatarSchema>;

// Xác thực thêm ngân hàng
export const CreateBankSchema = z.object({
  name: z
    .string()
    .min(1, "Vui lòng nhập tên ngân hàng")
    .max(100, "Tên ngân hàng quá dài"),

  number: z
    .string()
    .min(1, "Vui lòng nhập số tài khoản")
    .max(30, "Số tài khoản quá dài")
    .refine(
      (val) => /^[0-9]+$/.test(val),
      "Số tài khoản chỉ được chứa chữ số"
    ),

  holder: z
    .string()
    .min(1, "Vui lòng nhập tên chủ tài khoản")
    .max(100, "Tên chủ tài khoản quá dài"),

  branch: z
    .string()
    .max(100, "Tên chi nhánh quá dài")
    .optional(),

  primary: z
    .boolean()
    .optional()
    .default(false),
});

export type CreateBankData = z.infer<typeof CreateBankSchema>;

// Xác thực xoá ngân hàng
export const DeleteBankSchema = z.object({
  id: BankField,
});

export type DeleteBankData = z.infer<typeof DeleteBankSchema>;