import { Request, Response } from "express";
import { ClassroomService } from "../services/classroom";

export const ClassroomController = {
  /**
   * GET /api/v1/classrooms
   */
  async HandleGetAll(req: Request, res: Response) {
    try {
      // Gọi service
      const data = await ClassroomService.HandleGetAll();

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
   * GET /api/v1/classrooms/:id
   */
  async HandleGetById(req: Request, res: Response) {
    const id = req.params.id as string;

    try {
      const data = await ClassroomService.HandleGetById(id);

      if (!data) {
        return res.status(404).json({
          status: "ERROR",
          message: "Lớp học không tồn tại hoặc đã bị xóa!"
        });
      }

      return res.status(200).json({
        status: "SUCCESS",
        data: data
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
  async HandleCreate(req: Request, res: Response) {
    try {
      // Lấy user từ local
      const user = res.locals.user;

      // Kiểm tra xem có phải giáo viên không 
      if (user.role !== "TEACHER") {
        return res.status(403).json({ status: "ERROR" });
      }

      const id = user.id;
      const { name, description, fee, grade, capacity } = req.body;

      if (!name) {
        return res.status(400).json({ status: "ERROR" });
      }

      const new_class = await ClassroomService.HandleCreate(id, {
        name, description, fee, grade, capacity
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