import { Request, Response } from 'express';
import { BookmarkService } from '../services/bookmark-services';
import {
  GetBookmarksSchema,
  CreateBookmarkSchema,
} from '../validations/bookmark-validations';

export class BookmarkController {
  // Lấy danh sách bookmark (phân trang và theo type)
  static async get_bookmarks(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = GetBookmarksSchema.parse(req.query);

      const bookmarks = await BookmarkService.get_bookmarks(
        userId,
        validated.page,
        validated.limit,
        validated.type as "post" | "request"
      );

      res.status(200).json({
        code: 200,
        data: bookmarks,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách đã lưu!",
      });
    }
  }

  // Tạo mới bookmark (Post hoặc Request)
  static async create_bookmark(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateBookmarkSchema.parse(req.body);

      let bookmark;
      if (validated.requestId) {
        bookmark = await BookmarkService.create_request_bookmark(userId, validated.requestId);
      } else if (validated.postId) {
        bookmark = await BookmarkService.create_post_bookmark(userId, validated.postId);
      } else {
        throw new Error("Dữ liệu không hợp lệ!");
      }

      res.status(201).json({
        code: 201,
        data: bookmark,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Lưu thất bại!",
      });
    }
  }

  // Bỏ lưu bookmark (Post hoặc Request)
  static async delete_bookmark(
    req: Request<{ id: string }, any, any, { type?: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;
      const { id } = req.params;
      const { type } = req.query;

      if (type === 'post') {
        await BookmarkService.delete_post_bookmark(userId, id);
      } else if (type === 'request') {
        await BookmarkService.delete_request_bookmark(userId, id);
      } else {
        // Fallback: xoá ở cả 2 bảng nếu không truyền type
        await BookmarkService.delete_request_bookmark(userId, id);
        await BookmarkService.delete_post_bookmark(userId, id);
      }

      res.status(200).json({
        code: 200,
        message: "Bỏ lưu thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Bỏ lưu thất bại!",
      });
    }
  }
}