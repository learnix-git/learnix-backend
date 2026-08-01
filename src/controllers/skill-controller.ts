// GET    /api/v1/skills
// POST   /api/v1/skills
// DELETE /api/v1/skills/:topic

import { Request, Response } from "express";
import { SkillService } from "../services/skill-services";
import { CreateSkillSchema } from "../validations/tutor-validations";

export class SkillController {
  // Hàm lấy danh sách môn dạy
  static async get_skills(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const skills = await SkillService.get_skills(userId);

      res.status(200).json({
        code: 200,
        data: skills,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách môn dạy!",
      });
    }
  }

  // Hàm thêm môn dạy
  static async create_skill(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = CreateSkillSchema.parse(req.body);

      const skill = await SkillService.create_skill(
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

  // Hàm xoá môn dạy
  static async delete_skill(
    req: Request<{ topic: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { topic } = req.params;

      await SkillService.delete_skill(userId, topic);

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
}