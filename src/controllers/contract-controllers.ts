import { Request, Response } from 'express';
import { ContractService } from '../services/contract-services';

export class ContractController {

  // GET /api/v1/contracts/my  (học sinh)
  static async get_my_contracts_student(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const data = await ContractService.get_my_contracts_student(userId);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể lấy danh sách hợp đồng!' });
    }
  }

  // GET /api/v1/contracts/tutor  (gia sư)
  static async get_my_contracts_tutor(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const data = await ContractService.get_my_contracts_tutor(userId);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể lấy danh sách hợp đồng!' });
    }
  }

  // GET /api/v1/contracts/:id
  static async get_contract(req: Request<{ id: string }>, res: Response) {
    try {
      const userId     = res.locals.user.id;
      const contractId = req.params.id;
      const data = await ContractService.get_contract(contractId, userId);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      const status = error.message?.includes('quyền') ? 403 : 400;
      res.status(status).json({ code: status, message: error.message || 'Không thể lấy hợp đồng!' });
    }
  }

  // POST /api/v1/contracts
  // Học sinh tạo hợp đồng mời gia sư
  static async create_contract(req: Request, res: Response) {
    try {
      const userId = res.locals.user.id;
      const data = await ContractService.create_contract(userId, req.body);
      res.status(201).json({ code: 201, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể tạo hợp đồng!' });
    }
  }

  // PATCH /api/v1/contracts/:id/accept
  // Gia sư đồng ý
  static async accept_contract(req: Request<{ id: string }>, res: Response) {
    try {
      const userId     = res.locals.user.id;
      const contractId = req.params.id;
      const data = await ContractService.accept_contract(contractId, userId);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể duyệt hợp đồng!' });
    }
  }

  // PATCH /api/v1/contracts/:id/reject
  // Gia sư từ chối + lý do
  static async reject_contract(req: Request<{ id: string }>, res: Response) {
    try {
      const userId     = res.locals.user.id;
      const contractId = req.params.id;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ code: 400, message: 'Vui lòng nhập lý do từ chối!' });
        return;
      }
      const data = await ContractService.reject_contract(contractId, userId, reason);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể từ chối hợp đồng!' });
    }
  }

  // PATCH /api/v1/contracts/:id/cancel
  // Một trong 2 bên hủy hợp đồng (mất cọc)
  static async cancel_contract(req: Request<{ id: string }>, res: Response) {
    try {
      const userId     = res.locals.user.id;
      const contractId = req.params.id;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ code: 400, message: 'Vui lòng nhập lý do hủy!' });
        return;
      }
      const data = await ContractService.cancel_contract(contractId, userId, reason);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể hủy hợp đồng!' });
    }
  }

  // PATCH /api/v1/contracts/:id/finish
  // Kết thúc hợp đồng
  static async finish_contract(req: Request<{ id: string }>, res: Response) {
    try {
      const userId     = res.locals.user.id;
      const contractId = req.params.id;
      const data = await ContractService.finish_contract(contractId, userId);
      res.status(200).json({ code: 200, data });
    } catch (error: any) {
      res.status(400).json({ code: 400, message: error.message || 'Không thể kết thúc hợp đồng!' });
    }
  }
}
