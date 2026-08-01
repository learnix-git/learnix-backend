import { Request, Response } from "express";
import { UserService } from "../services/user-services";
import {
  UpdateInfoSchema,
  UpdateAvatarSchema,
  CreateBankSchema,
} from "../validations/user-validations";

export class UserController {
  // Hàm cập nhật thông tin cá nhân
  static async update_info(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const role = res.locals.user.role;

      // Xác thực nội dung body
      const validated = UpdateInfoSchema.parse(req.body);

      const user = await UserService.update_info(userId, role, validated);

      res.status(200).json({
        code: 200,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Cập nhật thông tin thất bại!",
      });
    }
  }

  // Hàm cập nhật avatar
  static async update_avatar(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = UpdateAvatarSchema.parse(req.body);

      const user = await UserService.update_avatar(userId, validated.url);

      res.status(200).json({
        code: 200,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Cập nhật avatar thất bại!",
      });
    }
  }

  // Hàm lấy thông tin user
  static async get_info(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const user = await UserService.get_info(id);

      res.status(200).json({
        code: 200,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy thông tin user!",
      });
    }
  }

  // Hàm lấy thông tin hồ sơ gia sư
  static async get_tutor_profile(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const tutor = await UserService.get_tutor_profile(id);

      res.status(200).json({
        code: 200,
        data: tutor,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy thông tin gia sư!",
      });
    }
  }

  // Hàm lấy thông tin hồ sơ phụ huynh/học sinh
  static async get_student_profile(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const student = await UserService.get_student_profile(id);

      res.status(200).json({
        code: 200,
        data: student,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy thông tin phụ huynh!",
      });
    }
  }

  // Hàm lấy danh sách ngân hàng đã liên kết
  static async get_banks(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const banks = await UserService.get_banks(userId);

      res.status(200).json({
        code: 200,
        data: banks,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách ngân hàng!",
      });
    }
  }

  // Hàm thêm ngân hàng
  static async create_bank(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = CreateBankSchema.parse(req.body);

      const bank = await UserService.create_bank(userId, validated);

      res.status(201).json({
        code: 201,
        data: bank,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Thêm ngân hàng thất bại!",
      });
    }
  }

  // Hàm xoá ngân hàng
  static async delete_bank(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      await UserService.delete_bank(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá ngân hàng thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá ngân hàng thất bại!",
      });
    }
  }
}