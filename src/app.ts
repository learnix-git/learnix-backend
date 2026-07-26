import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import AuthRoute from './routes/auth-routes';
import ChatRoute from './routes/chat-routes';
import NotificationRoute from './routes/notification-routes';
import UserRoute from './routes/user-routes';
import TutorRoute from './routes/tutor-routes';
import PostRoute from './routes/post-routes';
import RequestRoute from './routes/request-routes';
import FollowRoute from './routes/follow-routes';
import BookmarkRoute from './routes/bookmark-routes';
import SubjectRoute from './routes/subject-routes';

dotenv.config();

const app = express();

// Chống tấn công Brute Force
const rate_limiting= rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: { status: "ERROR", message: "Nhập mật khẩu sai quá nhiều, vui lòng thử lại sau 5 phút!" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Chống tấn công XSS, Clickjacking, Sniffing, ... 
app.use(helmet());

app.use('/api/v1/', rate_limiting);

app.use(express.json());

app.use('/api/v1/auth', AuthRoute);
app.use('/api/v1/chat', ChatRoute);
app.use('/api/v1/notifications', NotificationRoute);
app.use('/api/v1/user', UserRoute);
app.use('/api/v1/tutor', TutorRoute);
app.use('/api/v1/posts', PostRoute);
app.use('/api/v1/requests', RequestRoute);
app.use('/api/v1/follows', FollowRoute);
app.use('/api/v1/bookmarks', BookmarkRoute);
app.use('/api/v1/subjects', SubjectRoute);

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'SUCCESS', message: 'Backend đang chạy ... !' });
});

export default app;