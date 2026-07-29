import { Request, Response } from "express";
import { DegreeService } from "../services/degree-services";
import { CreateDegreeSchema } from "../validations/tutor-validations";

export class DegreeController {
  // ================== DEGREE ==================

  static async get_degrees(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const degrees = await DegreeService.get_degrees(userId);

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

      if (!req.file) {
        throw new Error("Vui lòng tải lên ảnh minh chứng!");
      }

      let parsedData: any;
      try {
        parsedData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;
      } catch (e) {
        throw new Error("Dữ liệu không hợp lệ!");
      }

      const validated = CreateDegreeSchema.parse(parsedData);

      const degree = await DegreeService.create_degree(
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

      await DegreeService.delete_degree(userId, id);

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
}
