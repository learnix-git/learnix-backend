import { Request, Response, NextFunction } from 'express';
import { verify } from '../utils/jwt';

export const compel = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ status: "ERROR", message: "Chưa có token!" });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status: "ERROR", message: "Token không hợp lệ!" });
    }

    const decoded = verify(token); 
    res.locals.user = decoded; 
    next();
  } catch (error: any) {
    return res.status(401).json({ status: "ERROR", message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};