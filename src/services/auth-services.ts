import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { hash, compare } from '../utils/bcrypt';
import { generate } from '../utils/jwt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

const google = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export class AuthService {  
  // Logic ĐĂNG KÝ
  static async register(data: { email: string; password: string; name: string; role?: any; gender: number }) {
    // Kiểm tra email có bị trùng không
    const exist = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exist) {
      throw new Error("Email này đã được sử dụng!");
    }

    // Mã hóa mật khẩu
    const pass = await hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: pass,
        name: data.name,
        gender: data.gender,
        role: data.role || "STUDENT",
      },
    });

    // Tạo token
    const token = generate({ id: user.id, role: user.role });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Logic ĐĂNG NHẬP
  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Email hoặc mật khẩu không chính xác!");
    }

    if (!user.active) {
      throw new Error("Tài khoản của bạn đã bị khóa!");
    }

    const vailid = await compare(data.password, user.password);
    if (!vailid) {
      throw new Error("Email hoặc mật khẩu không chính xác!");
    }

    // Cập nhật giờ đăng nhập cuối
    await prisma.user.update({
      where: { id: user.id },
      data: { login: new Date() },
    });

    const token = generate({ id: user.id, role: user.role });
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Logic ĐĂNG NHẬP bằng GOOGLE
  static async google_login(data: { code: string; uri: string }) {
    const { tokens } = await google.getToken({
      code: data.code,
      redirect_uri: data.uri,
    });

    const ticket = await google.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Không thể lấy thông tin từ Google!");
    }

    // Kiểm tra xem user này đã có trong Database chưa?
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    // Nếu chưa có tự động Đăng ký luôn cho khách!
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || "Người dùng Google",
          avatar: payload.picture || null,
          password: crypto.randomBytes(32).toString('hex'), 
          role: "STUDENT",
        },
      });
    } else {
      // Cập nhật giờ login nếu đã có tài khoản
      await prisma.user.update({
        where: { id: user.id },
        data: { login: new Date() },
      });
    }

    const token = generate({ id: user.id, role: user.role });
    const { password, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  // Logic lấy thông tin
  static async get_info(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, email: true, name: true, role: true, 
        gender: true, avatar: true, active: true 
      },
    });
    
    if (!user) {  
        throw new Error("User không tồn tại!");
    }
    return user;
  }
}