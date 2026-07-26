import { Request, Response } from 'express';
import { FollowService } from '../services/follow-services';
import {
  GetFollowsSchema,
  CreateFollowSchema,
} from '../validations/follow-validations';

export class FollowController {
  static async get_follows(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = GetFollowsSchema.parse(req.query);

      const follows = await FollowService.get_follows(
        userId,
        validated.page,
        validated.limit
      );

      res.status(200).json({
        code: 200,
        data: follows,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách theo dõi!",
      });
    }
  }

  static async create_follow(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateFollowSchema.parse(req.body);

      const follow = await FollowService.create_follow(
        userId,
        validated.tutorId
      );

      res.status(201).json({
        code: 201,
        data: follow,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Theo dõi thất bại!",
      });
    }
  }

  static async delete_follow(
    req: Request<{ tutorId: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { tutorId } = req.params;

      await FollowService.delete_follow(
        userId,
        tutorId
      );

      res.status(200).json({
        code: 200,
        message: "Bỏ theo dõi thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Bỏ theo dõi thất bại!",
      });
    }
  }
}