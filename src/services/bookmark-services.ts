// GET    /api/v1/bookmarks
// POST   /api/v1/bookmarks
// DELETE /api/v1/bookmarks/:requestId

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class BookmarkService {
  // Hàm quy đổi userId sang tutorId
  private static async get_tutor(userId: string) {
    const tutor = await prisma.tutor.findUnique({
      where: {
        user: userId,
      },
    });

    if (!tutor) {
      throw new Error("Bạn chưa đăng ký hồ sơ gia sư!");
    }

    return tutor;
  }

  // Hàm lấy danh sách request đã bookmark (phân trang)
  static async get_bookmarks(
    userId: string,
    page: number,
    limit: number
  ) {
    const tutor = await this.get_tutor(userId);

    const [total, rows] = await Promise.all([
      prisma.bookmark.count({
        where: {
          owner: tutor.id,
        },
      }),

      prisma.bookmark.findMany({
        where: {
          owner: tutor.id,
        },

        include: {
          request: {
            include: {
              subject: {
                select: {
                  name: true,
                  slug: true,
                },
              },

              student: {
                select: {
                  account: {
                    select: {
                      name: true,
                      alias: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          created: "desc",
        },

        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Hàm bookmark 1 request
  static async create_bookmark(
    userId: string,
    requestId: string
  ) {
    const tutor = await this.get_tutor(userId);

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      throw new Error("Yêu cầu không tồn tại!");
    }

    const exist = await prisma.bookmark.findUnique({
      where: {
        owner_need: {
          owner: tutor.id,
          need: requestId,
        },
      },
    });

    if (exist) {
      throw new Error("Bạn đã lưu yêu cầu này rồi!");
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        owner: tutor.id,
        need: requestId,
      },
    });

    return bookmark;
  }

  // Hàm bỏ bookmark 1 request
  static async delete_bookmark(
    userId: string,
    requestId: string
  ) {
    const tutor = await this.get_tutor(userId);

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        owner_need: {
          owner: tutor.id,
          need: requestId,
        },
      },
    });

    if (!bookmark) {
      throw new Error("Bạn chưa lưu yêu cầu này!");
    }

    await prisma.bookmark.delete({
      where: {
        owner_need: {
          owner: tutor.id,
          need: requestId,
        },
      },
    });
  }
}