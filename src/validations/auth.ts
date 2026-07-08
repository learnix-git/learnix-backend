import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string()
      .min(1, "Vui lòng nhập email")
      .email("Email không hợp lệ") 
      .max(255, "Email quá dài"),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .max(64, "Mật khẩu quá dài"), 
  });

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên quá dài"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(255, "Email quá dài"),
    role: z.enum(["TEACHER", "STUDENT", "ADMIN"]).optional().default("STUDENT"),
    gender: z.number().min(0, "Vui lòng chọn giới tính").max(2, "Giới tính không hợp lệ"),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(64, "Mật khẩu tối đa 64 ký tự")

      // Check chữ hoa
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa")
      
      // Check chữ thường
      
      .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái viết thường")
      
      // Check chữ số
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
      
      // Check ký tự đặc biệt
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)")
      
      // Check dấu cách
      .refine((val) => !val.includes(" "), "Mật khẩu không được chứa khoảng trắng"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;