import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Gender } from "@prisma/client";

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

    const map: Record<number, Gender> = {
      0: Gender.MALE,
      1: Gender.FEMALE,
      2: Gender.OTHER,
    };

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: pass,
        name: data.name,
        gender: map[data.gender] || Gender.OTHER,
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
          provider: "google",
          password: crypto.randomBytes(32).toString('hex'), 
          role: "STUDENT",
        },
      });
    } else {
      // Cập nhật giờ login nếu đã có tài khoản
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          login: new Date(),
          provider: "google" 
        },
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

    if (user.provider === "google") {
      const google = new Error("Tài khoản này đăng nhập bằng Google. Vui lòng đăng nhập qua Google!");
      (google as any).provider = "google";
      throw google;
    }
    
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
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background-color: #ffffff;">

          <!-- Brand -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td align="center" style="color: #3b82f6; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">
                Learnix Support
              </td>
            </tr>
          </table>

          <!-- Heading -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
              <td align="center" style="color: #0f172a; font-size: 22px; font-weight: 400; line-height: 1.4;">
                Yêu cầu đặt lại mật khẩu, <strong style="font-weight: 700;">${email}</strong>
              </td>
            </tr>
          </table>

          <!-- Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px;">
            <tr>
              <td style="padding: 28px 32px;">

                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                  Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản Learnix liên kết với email này.
                </p>

                <!-- Button -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                  <tr>
                    <td align="center">
                      <a href="${url}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; display: inline-block;">
                        Đặt lại mật khẩu ngay
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                  Link này có hiệu lực trong <strong style="white-space: nowrap;">15&nbsp;phút</strong> và chỉ dùng được một lần.
                </p>

                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 12px 0 0;">
                  <strong>Vui lòng không chia sẻ link này với bất kỳ ai</strong>: chúng tôi sẽ không bao giờ yêu cầu qua điện thoại hoặc email.
                </p>

              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <tr>
              <td style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
                Bạn nhận được email này vì có yêu cầu đặt lại mật khẩu cho tài khoản Learnix của bạn. Nếu đây không phải bạn, vui lòng bỏ qua email này.
              </td>
            </tr>
          </table>

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