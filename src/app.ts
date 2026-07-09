import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import AuthRoute from './routes/auth';
import ClassroomRoute from './routes/classroom'

dotenv.config();

const app = express();

// Chống tấn công XSS, Clickjacking, Sniffing, ... 
app.use(helmet());

// Chống tấn công Brute Force
const rate_limiting= rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { status: "ERROR", message: "Nhập mật khẩu sai quá nhiều, vui lòng thử lại sau 5 phút!" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/', rate_limiting);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use(express.json());

app.use('/api/v1/auth', AuthRoute);
app.use('/api/v1/classrooms', ClassroomRoute);

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'SUCCESS', message: 'Backend đang chạy ... !' });
});

export default app;