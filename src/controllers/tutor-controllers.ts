import { Request, Response } from "express";
import { TutorService } from "../services/tutor-services";
import {
  CreateSkillSchema,
  CreateDegreeSchema,
  CreateHistorySchema,
  UpdateHistorySchema,
  UpdateScheduleSchema,
} from "../validations/tutor-validations";

export class TutorController {
  // ================== SKILLS ==================

  static async get_skills(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const skills = await TutorService.get_skills(userId);

      res.status(200).json({
        code: 200,
        data: skills,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message || "Không thể lấy danh sách môn dạy!",
      });
    }
  }

  static async create_skill(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateSkillSchema.parse(req.body);

      const skill = await TutorService.create_skill(
        userId,
        validated
      );

      res.status(201).json({
        code: 201,
        data: skill,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Thêm môn dạy thất bại!",
      });
    }
  }

  static async delete_skill(
    req: Request<{ topic: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { topic } = req.params;

      await TutorService.delete_skill(userId, topic);

      res.status(200).json({
        code: 200,
        message: "Xoá môn dạy thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá môn dạy thất bại!",
      });
    }
  }

  // ================== DEGREES ==================

  static async get_degrees(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const degrees = await TutorService.get_degrees(userId);

      res.status(200).json({
        code: 200,
        data: degrees,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message || "Không thể lấy danh sách bằng cấp!",
      });
    }
  }

  static async create_degree(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateDegreeSchema.parse(req.body);

      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: "Vui lòng đính kèm ảnh minh chứng!",
        });
      }

      const degree = await TutorService.create_degree(
        userId,
        validated,
        req.file
      );

      res.status(201).json({
        code: 201,
        data: degree,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Thêm bằng cấp thất bại!",
      });
    }
  }

  static async delete_degree(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

      await TutorService.delete_degree(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá bằng cấp thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá bằng cấp thất bại!",
      });
    }
  }

  // ================== HISTORY ==================

  static async get_history(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const history = await TutorService.get_history(userId);

      res.status(200).json({
        code: 200,
        data: history,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách kinh nghiệm!",
      });
    }
  }

  static async create_history(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

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

  static async update_history(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

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

  static async delete_history(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
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

  static async get_schedule(req: Request, res: Response) {
    try {
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

  static async update_schedule(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

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
        message:
          error.message || "Cập nhật lịch dạy thất bại!",
      });
    }
  }
}