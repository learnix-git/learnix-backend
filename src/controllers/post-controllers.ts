import { Request, Response } from 'express';
import { PostService } from '../services/post-services';
import {
  GetPostsSchema,
  CreatePostSchema,
  UpdatePostSchema,
} from '../validations/post-validations';

export class PostController {
  static async get_posts(req: Request, res: Response) {
    try {
      const userId = res.locals.user?.id;
      const validated = GetPostsSchema.parse(req.query);

      const posts = await PostService.get_posts(validated, userId);

      res.status(200).json({
        code: 200,
        data: posts,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách bài đăng!",
      });
    }
  }

  static async get_my_posts(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sort = req.query.sort as "newest" | "oldest" | "price-desc" | "price-asc" | undefined;
      const status = req.query.status as any;
      const search = req.query.search as string | undefined;

      const posts = await PostService.get_my_posts(
        userId,
        { page, limit, sort, status, search }
      );

      res.status(200).json({
        code: 200,
        data: posts,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách bài đăng của bạn!",
      });
    }
  }

  static async get_post(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user?.id;
      const { id } = req.params;

      const post = await PostService.get_post(id, userId);

      res.status(200).json({
        code: 200,
        data: post,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy chi tiết bài đăng!",
      });
    }
  }

  static async create_post(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;

      const validated = CreatePostSchema.parse(req.body);

      const post = await PostService.create_post(
        userId,
        validated
      );

      res.status(201).json({
        code: 201,
        data: post,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Đăng bài thất bại!",
      });
    }
  }

  static async update_post(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

      const validated = UpdatePostSchema.parse(req.body);

      const post = await PostService.update_post(
        userId,
        id,
        validated
      );

      res.status(200).json({
        code: 200,
        data: post,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Sửa bài đăng thất bại!",
      });
    }
  }

  static async delete_post(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

      await PostService.delete_post(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá bài đăng thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Xoá bài đăng thất bại!",
      });
    }
  }
}