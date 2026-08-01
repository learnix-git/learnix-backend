import { Request, Response } from "express";
import { PaymentService } from "../services/payment-services";

export class PaymentController {
  // Hàm lấy lịch sử thanh toán của user
  static async get_my_payments(
    req: Request,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;

      const data = await PaymentService.get_my_payments(userId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể lấy lịch sử thanh toán!",
      });
    }
  }

  // Hàm học sinh đặt cọc 30%
  static async student_deposit(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await PaymentService.student_deposit(contractId, userId);

      res.status(201).json({
        code: 201,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đặt cọc!",
      });
    }
  }

  // Hàm gia sư đặt cọc 30% phí nhận lớp
  static async tutor_deposit(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await PaymentService.tutor_deposit(contractId, userId);

      res.status(201).json({
        code: 201,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể đặt cọc!",
      });
    }
  }

  // Hàm học sinh thanh toán 70% còn lại sau tháng đầu
  static async student_pay_final(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      // Lấy user đang đăng nhập
      const userId = res.locals.user.id;
      const contractId = req.params.id;

      const data = await PaymentService.student_pay_final(
        contractId,
        userId
      );

      res.status(201).json({
        code: 201,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể thanh toán!",
      });
    }
  }

  // Hàm admin xác nhận đã chuyển tiền cho gia sư
  static async confirm_payout(
    req: Request<{ id: string }>,
    res: Response
  ) {
    try {
      const paymentId = req.params.id;

      const data = await PaymentService.confirm_payout(paymentId);

      res.status(200).json({
        code: 200,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message: error.message || "Không thể xác nhận payout!",
      });
    }
  }
}