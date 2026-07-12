import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { hash, compare } from '../utils/bcrypt';
import { generate } from '../utils/jwt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

const google = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export class AuthService {  
  // ! Logic ĐĂNG KÝ
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

  // ! Logic ĐĂNG NHẬP
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

  // ! Logic ĐĂNG NHẬP bằng GOOGLE
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

  // ! Logic lấy thông tin
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

  // ! Logic quên mật khẩu
  static async forgot_password(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) 
      throw new Error("Email này chưa được đăng ký trên hệ thống!");

    const reset_token = crypto.randomBytes(32).toString("hex");
    const reset_expire = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { token: reset_token, expire: reset_expire },
    });

    const url = `http://localhost:4000/reset-password?token=${reset_token}`;

    const mail = {
      from: `"Learnix Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Khôi phục mật khẩu tài khoản Learnix",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 32px 16px;">
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">

            <!-- Header -->
            <div style="background-color: #3b82f6; padding: 28px 32px; text-align: center;">
              <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Learnix</span>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <div style="width: 56px; height: 56px; background-color: #eff6ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 26px;">🔒</span>
              </div>

              <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">Yêu cầu đặt lại mật khẩu</h2>

              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">Chào bạn,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản Learnix liên kết với email này.
              </p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Vui lòng nhấp vào nút bên dưới để thiết lập mật khẩu mới. Link có hiệu lực trong
                <strong style="color: #0f172a;">15 phút</strong>.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${url}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(59,130,246,0.35);">
                  Đặt lại mật khẩu ngay
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; word-break: break-all; margin: 0 0 24px;">
                Nếu nút bên trên không hoạt động, hãy sao chép và dán đường link sau vào trình duyệt:<br />
                <a href="${url}" style="color: #3b82f6;">${url}</a>
              </p>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                  Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email — tài khoản của bạn vẫn an toàn.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Learnix. Nền tảng học tập & giảng dạy trực tuyến.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mail);
  }

  // ! Logic đặt lại mật khẩu
  static async reset_password(token: string, password: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        token: token, 
        expire: { gt: new Date() }, 
      },
    });

    if (!user) {
      throw new Error("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!");
    }

    const hashed = await hash(password); 

    await prisma.user.update({
      where: { id: user.id }, 
      data: {
        password: hashed,
        token: null,  
        expire: null, 
      },
    });
  }
}