// PATCH  /api/v1/user/update-info
// PATCH  /api/v1/user/update-avatar
// PATCH  /api/v1/user/student/info
// PATCH  /api/v1/user/tutor/info

// GET    /api/v1/user/:id/info
// GET    /api/v1/user/tutors/:id
// GET    /api/v1/user/students/:id

// GET    /api/v1/user/banks
// POST   /api/v1/user/banks
// DELETE /api/v1/user/banks/:id

import { PrismaClient, Gender, Role, State } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

export class UserService {
  // Logic cập nhật thông tin 
  static async update_info(userId: string, role: Role, data: {
    name?: string; alias?: string; dob?: string; gender?: Gender; phone?: string;
    city?: string; district?: string; ward?: string; street?: string; lat?: number; lng?: number;
    bio?: string; level?: string; major?: string; school?: string;
  }) {
    // Trường thông tin chung
    const payload: Record<string, any> = {};

    if (data.name !== undefined) {
      payload.name = data.name;
    }
    if (data.alias !== undefined) {
      payload.alias = data.alias;
    }
    if (data.dob !== undefined) {
      payload.dob = new Date(data.dob);
    }
    if (data.gender !== undefined) {
      payload.gender = data.gender;
    }
    if (data.phone !== undefined) {
      payload.phone = data.phone;
    }

    const user = Object.keys(payload).length > 0
      ? await prisma.user.update({
          where: { id: userId },
          data: payload,
          select: {
            id: true, name: true, alias: true, dob: true,
            gender: true, phone: true, role: true,
          },
        })
      : await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true, name: true, alias: true, dob: true,
            gender: true, phone: true, role: true,
          },
        });

    // Trường địa chỉ dùng chung
    const address: Record<string, any> = {};
    if (data.city !== undefined) {
      address.city = data.city;
    }
    if (data.district !== undefined) {
      address.district = data.district;
    }
    if (data.ward !== undefined) {
      address.ward = data.ward;
    }
    if (data.street !== undefined) {
      address.street = data.street;
    }
    if (data.lat !== undefined) {
      address.lat = data.lat;
    }
    if (data.lng !== undefined) {
      address.lng = data.lng;
    }

    // Nếu là STUDENT → nhận address
    if (role === Role.STUDENT && Object.keys(address).length > 0) {
      await prisma.student.upsert({
        where: { user: userId },
        create: { user: userId, ...address },
        update: address,
      });
    }

    // Nếu là TUTOR → nhận address + trường thông tin riêng
    if (role === Role.TUTOR) {
      const payload: Record<string, any> = { ...address };

      if (data.bio !== undefined) {
        payload.bio = data.bio;
      }
      if (data.level !== undefined) {
        payload.level = data.level;
      }
      if (data.major !== undefined) {
        payload.major = data.major;
      }
      if (data.school !== undefined) {
        payload.school = data.school;
      }

      if (Object.keys(payload).length > 0) {
        await prisma.tutor.upsert({
          where: { user: userId },
          create: { user: userId, ...payload },
          update: payload,
        });
      }
    }

    return user;
  }

  // Logic cập nhật avatar
  static async update_avatar(userId: string, url: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
      select: { id: true, avatar: true },
    });

    return user;
  }

  // Logic lấy thông tin công khai
  static async get_info(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, active: true, deleted: null },
      select: {
        id: true, name: true, alias: true, role: true,
        gender: true, avatar: true,
      },
    });

    if (!user) {
      throw new Error("User không tồn tại!");
    }

    return user;
  }

  // Logic lấy thông tin công khai của gia sư
  static async get_tutor_profile(idOrUserId: string) {
    const tutor = await prisma.tutor.findFirst({
      where: {
        OR: [
          { user: idOrUserId },
          { id: idOrUserId },
          { account: { alias: idOrUserId } }
        ]
      },
      select: {
        id: true, bio: true, level: true, major: true, school: true, exp: true,
        rate: true, modes: true, city: true, ward: true,
        rating: true, reviews: true,
        account: {
          select: { name: true, alias: true, avatar: true, gender: true },
        },
        skills: {
          select: { topic: true, grades: true, subject: { select: { name: true, slug: true } } },
        },
        degrees: {
          where: { status: State.VERIFIED },
          select: { name: true, type: true, issuer: true, year: true },
        },
        jobs: {
          select: { title: true, place: true, start: true, end: true, desc: true },
        },
        posts: {
          where: { status: 'OPEN' },
          select: { id: true, title: true, from: true, to: true, unit: true, created: true },
        },
      },
    });

    if (!tutor) {
      throw new Error("Gia sư không tồn tại!");
    }

    return tutor;
  }

  // Logic lấy thông tin công khai của học sinh
  static async get_student_profile(userId: string) {
    const student = await prisma.student.findUnique({
      where: { user: userId },
      select: {
        id: true, city: true, district: true,
        account: {
          select: { name: true, alias: true, avatar: true },
        },
      },
    });

    if (!student) {
      throw new Error("Phụ huynh không tồn tại!");
    }

    return student;
  }

  // Logic lấy danh sách ngân hàng
  static async get_banks(userId: string) {
    const banks = await prisma.bank.findMany({
      where: { owner: userId },
      select: { id: true, name: true, number: true, holder: true, branch: true, primary: true },
    });

    return banks;
  }

  // Logic thêm ngân hàng
  static async create_bank(userId: string, data: { name: string; number: string; holder: string; branch?: string; primary?: boolean }) {
    if (data.primary) {
      await prisma.bank.updateMany({
        where: { owner: userId, primary: true },
        data: { primary: false },
      });
    }

    const bank = await prisma.bank.create({
      data: { owner: userId, ...data },
    });

    return bank;
  }

  // Logic xoá ngân hàng
  static async delete_bank(userId: string, bankId: string) {
    const bank = await prisma.bank.findUnique({ where: { id: bankId } });

    if (!bank || bank.owner !== userId) {
      throw new Error("Tài khoản ngân hàng không tồn tại!");
    }

    await prisma.bank.delete({ where: { id: bankId } });
  }
}