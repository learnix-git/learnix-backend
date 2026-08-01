// GET  /api/v1/notifications
// PATCH /api/v1/notifications/:id/read
// PATCH /api/v1/notifications/read-all

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { getIO } from '../sockets/init';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export interface Notice {
  ownerId: string;
  title: string;
  content: string;
  type: string;
  link?: string | null;
}

export class NotificationService {
  // Hàm tạo thông báo
  static async push(input: Notice) {
    // Tạo thông báo
    const notice = await prisma.notice.create({
      data: {
        owner: input.ownerId,
        title: input.title,
        content: input.content,
        type: input.type,
        link: input.link ?? null,
      },
    });

    // Gọi socket
    try {
      getIO().to(`user:${input.ownerId}`).emit("notification:new", notice);
    } catch (err) {
      console.error("[notification] emit socket thất bại:", err);
    }

    return notice;
  }

  // Hàm lấy danh sách thông báo
  static async list(
    userId: string,
    page: number,
    limit: number
  ) {
    // Đếm tổng, đếm chưa đọc, lấy 1 trang dữ liệu song song
    const [total, unreadCount, items] = await Promise.all([
      prisma.notice.count({
        where: {
          owner: userId,
        },
      }),
      prisma.notice.count({
        where: {
          owner: userId,
          read: false,
        },
      }),
      prisma.notice.findMany({
        where: {
          owner: userId,
        },
        orderBy: {
          created: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
    };
  }

  // Hàm đánh dấu 1 thông báo đã đọc
  static async mark_read(
    userId: string,
    id: string
  ) {
    // Tìm kiếm thông báo
    const notice = await prisma.notice.findUnique({
      where: {
        id,
      },
    });

    // Kiểm tra quyền sở hữu
    if (
      !notice ||
      notice.owner !== userId
    ) {
      throw new Error("Thông báo không tồn tại!");
    }

    // Đã đọc rồi thì không cần cập nhật lại
    if (notice.read) return 0;

    await prisma.notice.update({
      where: {
        id,
      },
      data: {
        read: true,
      },
    });

    return 1;
  }

  // Hàm đánh dấu tất cả thông báo đã đọc
  static async mark_read_all(userId: string) {
    const result = await prisma.notice.updateMany({
      where: {
        owner: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return result.count;
  }
}