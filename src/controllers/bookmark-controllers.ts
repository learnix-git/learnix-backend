import { Request, Response } from 'express';
import { BookmarkService } from '../services/bookmark-services';
import {
  GetBookmarksSchema,
  CreateBookmarkSchema,
} from '../validations/bookmark-validations';

export class BookmarkController {
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
        validated.limit
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

  static async create_bookmark(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateBookmarkSchema.parse(req.body);

      const bookmark =
        await BookmarkService.create_bookmark(
          userId,
          validated.requestId
        );

      res.status(201).json({
        code: 201,
        data: bookmark,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Lưu yêu cầu thất bại!",
      });
    }
  }

  static async delete_bookmark(
    req: Request<{ requestId: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { requestId } = req.params;

      await BookmarkService.delete_bookmark(
        userId,
        requestId
      );

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