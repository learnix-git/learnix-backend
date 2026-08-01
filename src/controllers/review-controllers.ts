// GET    /api/v1/reviews/tutor/:id
// POST   /api/v1/reviews
// DELETE /api/v1/reviews/:id

import { Request, Response } from "express";
import { ReviewService } from "../services/review-services";
import {
  GetReviewsSchema,
  CreateReviewSchema,
} from "../validations/review-validations";

export class ReviewController {
  // Hàm lấy danh sách đánh giá của 1 gia sư
  static async get_reviews(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      // Xác thực nội dung query
      const validated = GetReviewsSchema.parse(req.query);

      const reviews = await ReviewService.get_reviews(
        id,
        validated.page,
        validated.limit
      );

      res.status(200).json({
        code: 200,
        data: reviews,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách đánh giá!",
      });
    }
  }

  // Hàm tạo đánh giá
  static async create_review(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
      const validated = CreateReviewSchema.parse(req.body);

      const review = await ReviewService.create_review(
        userId,
        validated
      );

      res.status(201).json({
        code: 201,
        data: review,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Đánh giá thất bại!",
      });
    }
  }

  // Hàm xoá đánh giá
  static async delete_review(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      await ReviewService.delete_review(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá đánh giá thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá đánh giá thất bại!",
      });
    }
  }
}