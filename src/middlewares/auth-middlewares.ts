import { Request, Response, NextFunction } from 'express';
import { verify } from '../utils/jwt';

export const compel = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Kiểm tra token trong header
    const header = req.headers.authorization;
    if (!header) {
      // Header không có token sẽ báo lỗi 401
      return res.status(401).json({ status: "ERROR", message: "Chưa có token!" });
    }

    // Trích xuất token
    const token = header.split(' ')[1];
    if (!token) {
      // Token sai định dạng hoặc rỗng sẽ báo lỗi 401
      return res.status(401).json({ status: "ERROR", message: "Token không hợp lệ!" });
    }

    // Giải mã token
    const decoded = verify(token);
     
    // Lưu thông tin vào local
    res.locals.user = decoded; 
    next();
  } catch (error: any) {
    return res.status(401).json({ status: "ERROR", message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};