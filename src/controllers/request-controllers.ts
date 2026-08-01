import { Request, Response } from "express";
import { RequestService } from "../services/request-services";
import {
  GetRequestsSchema,
  CreateRequestSchema,
  UpdateRequestSchema,
} from "../validations/request-validations";

export class RequestController {
  // Hàm lấy danh sách yêu cầu
  static async get_requests(
    req: Request,
    res: Response
  ) {
    try {
      // Xác thực nội dung query
      const validated = GetRequestsSchema.parse(req.query);

      // Lấy user đang đăng nhập
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
        message: error.message || "Không thể lấy danh sách yêu cầu!",
      });
    }
  }

  // Hàm lấy danh sách yêu cầu của học sinh hiện tại
  static async get_my_requests(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Đọc filter thủ công từ query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as any;
      const search = req.query.search as string | undefined;

      const sort = req.query.sort as
        | "newest"
        | "highest_price"
        | undefined;

      const requests = await RequestService.get_my_requests(userId, {
        page,
        limit,
        sort,
        status,
        search,
      });

      res.status(200).json({
        code: 200,
        data: requests,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách yêu cầu của tôi!",
      });
    }
  }

  // Hàm lấy chi tiết 1 yêu cầu
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
        message: error.message || "Không thể lấy chi tiết yêu cầu!",
      });
    }
  }

  // Hàm tạo yêu cầu
  static async create_request(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      // Xác thực nội dung body
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
        message: error.message || "Đăng yêu cầu thất bại!",
      });
    }
  }

  // Hàm sửa yêu cầu
  static async update_request(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      // Xác thực nội dung body
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
        message: error.message || "Sửa yêu cầu thất bại!",
      });
    }
  }

  // Hàm xoá yêu cầu
  static async delete_request(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const { id } = req.params;

      await RequestService.delete_request(userId, id);

      res.status(200).json({
        code: 200,
        message: "Xoá yêu cầu thành công!",
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Xoá yêu cầu thất bại!",
      });
    }
  }
}