import { Request, Response } from 'express';
import { RequestService } from '../services/request-services';
import {
  GetRequestsSchema,
  CreateRequestSchema,
  UpdateRequestSchema,
} from '../validations/request-validations';

export class RequestController {
  static async get_requests(req: Request, res: Response) {
    try {
      const validated = GetRequestsSchema.parse(req.query);
      const userId = res.locals.user?.id;

      const requests = await RequestService.get_requests(
        validated,
        userId
      );

      res.status(200).json({
        code: 200,
        data: requests,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách yêu cầu!",
      });
    }
  }

  static async get_request(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const request = await RequestService.get_request(id);

      res.status(200).json({
        code: 200,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy chi tiết yêu cầu!",
      });
    }
  }

  static async create_request(
    req: Request,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const validated = CreateRequestSchema.parse(req.body);

      const request = await RequestService.create_request(
        userId,
        validated
      );

      res.status(201).json({
        code: 201,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Đăng yêu cầu thất bại!",
      });
    }
  }

  static async update_request(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

      const validated = UpdateRequestSchema.parse(req.body);

      const request = await RequestService.update_request(
        userId,
        id,
        validated
      );

      res.status(200).json({
        code: 200,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Sửa yêu cầu thất bại!",
      });
    }
  }

  static async delete_request(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = res.locals.user.id;

      const { id } = req.params;

      await RequestService.delete_request(
        userId,
        id
      );

      res.status(200).json({
        code: 200,
        message: "Xoá yêu cầu thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Xoá yêu cầu thất bại!",
      });
    }
  }
}