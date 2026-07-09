import { Request, Response } from "express";
import { ClassroomService } from "../services/classroom";

export const ClassroomController = {
  /**
   * GET /api/v1/classrooms
   */
  async get_all_classroom(req: Request, res: Response) {
    try {
      // Lấy user từ local
      const user = res.locals.user;

      // Gọi service
      const data = await ClassroomService.get_all_classroom();

      return res.status(200).json({
        status: "SUCCESS",
        data: data,
      });
    } catch (error: any) {
      console.error("Error:", error);
      return res.status(500).json({
        status: "ERROR",
        message: error.message || "Lỗi server!",
        errors: error.errors || null,
      });
    }
  },
  
  /**
   * POST /api/v1/classrooms
   */
  async create_classroom(req: Request, res: Response) {
    try {
      // Lấy user từ local
      const user = res.locals.user;

      // Kiểm tra xem có phải giáo viên không 
      if (user.role !== "TEACHER") {
        return res.status(403).json({ status: "ERROR" });
      }

      const id = user.id;
      const { name, code, description, fee, grade, capacity } = req.body;

      if (!name || !code) {
        return res.status(400).json({ status: "ERROR" });
      }

      const new_class = await ClassroomService.create_classroom(id, {
        name, code, description, fee, grade, capacity
      });

      return res.status(201).json({
        status: "SUCCESS",
        data: new_class
      });
    } catch (error: any) {
      console.error("Error:", error);

      if (error.code === 'P2002') {
        return res.status(400).json({ 
          status: "ERROR", 
          message: "Mã lớp học này đã tồn tại!" 
        });
      }

      return res.status(500).json({ 
        status: "ERROR", 
        message: "Lỗi server!",
        errors: error.message 
      });
    }
  }
};