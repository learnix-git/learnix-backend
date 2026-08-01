import { Request, Response } from "express";
import { ContractService } from "../services/contract-services";

export class ContractController {
  // Hàm lấy danh sách hợp đồng của học sinh
  static async get_my_contracts_student(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const data = await ContractService.get_my_contracts_student(userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách hợp đồng!",
      });
    }
  }

  // Hàm lấy danh sách hợp đồng của gia sư
  static async get_my_contracts_tutor(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const data = await ContractService.get_my_contracts_tutor(userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy danh sách hợp đồng!",
      });
    }
  }

  // Hàm lấy chi tiết 1 hợp đồng
  static async get_contract(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await ContractService.get_contract(contractId, userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      // Trả 403 nếu lỗi liên quan tới quyền xem
      const status = error.message?.includes("quyền") ? 403 : 400;

      res.status(status).json({
        code: status,
        message: error.message || "Không thể lấy hợp đồng!",
      });
    }
  }

  // Hàm học sinh tạo hợp đồng mời gia sư
  static async create_contract(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const data = await ContractService.create_contract(userId, req.body);

      res.status(201).json({
        code: 201,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể tạo hợp đồng!",
      });
    }
  }

  // Hàm gia sư đồng ý hợp đồng
  static async accept_contract(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await ContractService.accept_contract(contractId, userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể duyệt hợp đồng!",
      });
    }
  }

  // Hàm gia sư từ chối hợp đồng kèm lý do
  static async reject_contract(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;
      const { reason } = req.body;

      // Bắt buộc phải có lý do từ chối
      if (!reason) {
        res.status(400).json({
          code: 400,
          message: "Vui lòng nhập lý do từ chối!",
        });

        return;
      }

      const data = await ContractService.reject_contract(
        contractId,
        userId,
        reason
      );

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể từ chối hợp đồng!",
      });
    }
  }

  // Hàm hủy hợp đồng, một trong 2 bên hủy sẽ mất cọc
  static async cancel_contract(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;
      const { reason } = req.body;

      // Bắt buộc phải có lý do hủy
      if (!reason) {
        res.status(400).json({
          code: 400,
          message: "Vui lòng nhập lý do hủy!",
        });

        return;
      }

      const data = await ContractService.cancel_contract(
        contractId,
        userId,
        reason
      );

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể hủy hợp đồng!",
      });
    }
  }

  // Hàm kết thúc hợp đồng
  static async finish_contract(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await ContractService.finish_contract(contractId, userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể kết thúc hợp đồng!",
      });
    }
  }
}