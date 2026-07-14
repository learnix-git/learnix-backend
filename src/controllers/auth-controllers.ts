import { Request, Response } from 'express';
import { AuthService } from '../services/auth-services';
import { registerSchema, loginSchema } from '../validations/auth-validations';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);

      res.status(201).json({
        code: 201,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Đã có lỗi xảy ra khi đăng ký!",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);

      res.status(200).json({
        code: 200,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Đăng nhập thất bại!",
      });
    }
  }

  static async google_login(req: Request, res: Response) {
    try {
      const { code, uri } = req.body;
      
      if (!code || !uri) {
        return res.status(400).json({ code: 400, message: "Thiếu dữ liệu Google Auth!" });
      }

      const result = await AuthService.google_login({ code, uri });

      res.status(200).json({
        code: 200,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Đăng nhập bằng Google thất bại!",
      });
    }
  }

  static async forgot_password(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      await AuthService.forgot_password(email);

      return res.status(200).json({
        code: 200,
        message: "Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn.",
      });
    } catch (error: any) {
      const message = error.message || "Không thể gửi email khôi phục. Vui lòng thử lại sau!";
      const provider = error.provider || null;
      
      return res.status(400).json({
        code: 400,
        message: message,
        data: {
          provider: provider
        }
      });
    }
  }

  static async reset_password(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      await AuthService.reset_password(token, password);

      return res.status(200).json({
        code: 200,
        message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
    } catch (error: any) {
      const message = error.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại!";
      return res.status(400).json({
        code: 400,
        message: message,
      });
    }
  }

  static async info(req: Request, res: Response) {
    try {
      const id = res.locals.user.id; 
      
      const user = await AuthService.get_info(id);
      res.status(200).json({ code: 200, data: user });
    } catch (error: any) {
      res.status(500).json({ code: 500, message: error.message });
    }
  }
}