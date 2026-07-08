import { Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { registerSchema, loginSchema } from '../validations/auth';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);

      res.status(201).json({
        status: "SUCCESS",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: "ERROR",
        message: error.message || "Đã có lỗi xảy ra khi đăng ký!",
        errors: error.errors || null,
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);

      res.status(200).json({
        status: "SUCCESS",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: "ERROR",
        message: error.message || "Đăng nhập thất bại!",
        errors: error.errors || null,
      });
    }
  }

  static async google_login(req: Request, res: Response) {
    try {
      const { code, uri } = req.body;
      
      if (!code || !uri) {
        return res.status(400).json({ status: "ERROR", message: "Thiếu dữ liệu Google Auth!" });
      }

      const result = await AuthService.google_login({ code, uri });

      res.status(200).json({
        status: "SUCCESS",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: "ERROR",
        message: error.message || "Đăng nhập bằng Google thất bại!",
      });
    }
  }

  static async info(req: Request, res: Response) {
    try {
      const id = res.locals.user.id; 
      
      const user = await AuthService.get_info(id);
      res.status(200).json({ status: "SUCCESS", data: user });
    } catch (error: any) {
      res.status(500).json({ status: "ERROR", message: error.message });
    }
  }
}