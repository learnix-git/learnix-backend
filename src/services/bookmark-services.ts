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
  // Hàm lấy danh sách cuộc trò chuyện đã lưu
  static async get_bookmarks(
    userId: string,
    page: number,
    limit: number,
    type: "post" | "request"
  ) {
    if (type === "post") {
      const [total, rows] = await Promise.all([
        prisma.savedPost.count({
          where: {
            user: userId,
          },
        }),
        prisma.savedPost.findMany({
          where: {
            user: userId,
          },
          include: {
            class: {
              include: {
                topics: {
                  include: {
                    topic: {
                      select: {
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
                tutor: {
                  select: {
                    id: true,
                    rating: true,
                    reviews: true,
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
        items: rows.map(r => ({ ...r, post: r.class })), // alias class to post for frontend compatibility
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Default to request
    const [total, rows] = await Promise.all([
      prisma.savedRequest.count({
        where: {
          user: userId,
        },
      }),

      prisma.savedRequest.findMany({
        where: {
          user: userId,
        },
        include: {
          request: {
            include: {
              topics: {
                include: {
                  topic: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
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

  // Hàm lưu bài đăng (gia sư)
  static async create_post_bookmark(userId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new Error("Bài đăng không tồn tại!");

    return await prisma.savedPost.upsert({
      where: {
        user_post: {
          user: userId,
          post: postId,
        },
      },
      update: {},
      create: {
        user: userId,
        post: postId,
      },
    });
  }

  // Hàm bỏ lưu bài đăng (gia sư)
  static async delete_post_bookmark(userId: string, postId: string) {
    try {
      await prisma.savedPost.delete({
        where: {
          user_post: {
            user: userId,
            post: postId,
          },
        },
      });
    } catch (e) {
      // Bỏ qua nếu không tồn tại
    }
  }

  // Hàm lưu yêu cầu (học viên)
  static async create_request_bookmark(
    userId: string,
    requestId: string
  ) {
    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      throw new Error("Yêu cầu không tồn tại!");
    }

    const exist = await prisma.savedRequest.findUnique({
      where: {
        user_need: {
          user: userId,
          need: requestId,
        },
      },
    });

    if (exist) {
      throw new Error("Bạn đã lưu yêu cầu này rồi!");
    }

    const bookmark = await prisma.savedRequest.create({
      data: {
        user: userId,
        need: requestId,
      },
    });

    return bookmark;
  }

  // Hàm bỏ lưu yêu cầu (học viên)
  static async delete_request_bookmark(
    userId: string,
    requestId: string
  ) {
    try {
      await prisma.savedRequest.delete({
        where: {
          user_need: {
            user: userId,
            need: requestId,
          },
        },
      });
    } catch (error) {
      // Bỏ qua nếu không tồn tại
    }
  }
}
