import { Request, Response } from "express";
import { TutorService } from "../services/tutor-services";
import {
  CreateHistorySchema,
  UpdateHistorySchema,
  UpdateScheduleSchema,
} from "../validations/tutor-validations";

export class TutorController {
  // ================== HISTORY ==================

  // Hàm lấy danh sách kinh nghiệm
  static async get_history(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const history = await TutorService.get_history(userId);

      res.status(200).json({
        code: 200,
        data: history,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách kinh nghiệm!",
      });
    }
  }

  // Hàm thêm kinh nghiệm
  static async create_history(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = CreateHistorySchema.parse(req.body);

      const history = await TutorService.create_history(
        userId,
        validated
      );

      res.status(201).json({
        code: 201,
        data: history,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Thêm kinh nghiệm thất bại!",
      });
    }
  }

  // Hàm sửa kinh nghiệm
  static async update_history(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      // Xác thực nội dung body
      const validated = UpdateHistorySchema.parse(req.body);

      const history = await TutorService.update_history(
        userId,
        id,
        validated
      );

      res.status(200).json({
        code: 200,
        data: history,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Sửa kinh nghiệm thất bại!",
      });
    }
  }

  // Hàm xoá kinh nghiệm
  static async delete_history(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      await TutorService.delete_history(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá kinh nghiệm thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá kinh nghiệm thất bại!",
      });
    }
  }

  // ================== SCHEDULE ==================

  // Hàm lấy lịch dạy
  static async get_schedule(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const schedule = await TutorService.get_schedule(userId);

      res.status(200).json({
        code: 200,
        data: schedule,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy lịch dạy!",
      });
    }
  }

  // Hàm cập nhật lịch dạy
  static async update_schedule(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = UpdateScheduleSchema.parse(req.body);

      const schedule = await TutorService.update_schedule(
        userId,
        validated.slots
      );

      res.status(200).json({
        code: 200,
        data: schedule,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Cập nhật lịch dạy thất bại!",
      });
    }
  }
}