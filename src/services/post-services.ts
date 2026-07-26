// GET    /api/v1/posts 
// GET    /api/v1/posts/:id
// POST   /api/v1/posts  
// PATCH  /api/v1/posts/:id 
// DELETE /api/v1/posts/:id 

import { PrismaClient, Level, Mode, State } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class PostService {
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

  // Hàm lấy danh sách bài đăng
  static async get_posts(filter: {
    page: number;
    limit: number;
    topic?: string;
    level?: Level;
    grade?: number;
    mode?: Mode;
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    // Xây điều kiện lọc động
    const where: Record<string, any> = {
      status: State.OPEN,
    };

    if (filter.topic !== undefined) {
      where.topic = filter.topic;
    }

    if (filter.level !== undefined) {
      where.level = filter.level;
    }

    if (filter.grade !== undefined) {
      where.grade = filter.grade;
    }

    if (filter.mode !== undefined) {
      where.mode = filter.mode;
    }

    if (filter.city !== undefined) {
      where.city = filter.city;
    }

    if (filter.district !== undefined) {
      where.district = filter.district;
    }

    if (filter.minPrice !== undefined) {
      where.to = {
        gte: filter.minPrice,
      };
    }

    if (filter.maxPrice !== undefined) {
      where.from = {
        lte: filter.maxPrice,
      };
    }

    // Đếm và lấy danh sách song song
    const [total, rows] = await Promise.all([
      prisma.post.count({
        where,
      }),

      prisma.post.findMany({
        where,

        include: {
          subject: {
            select: {
              name: true,
              slug: true,
            },
          },

          tutor: {
            select: {
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

        orderBy: {
          created: "desc",
        },

        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
    ]);

    return {
      items: rows,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  // Hàm lấy chi tiết 1 bài đăng
  static async get_post(postId: string) {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },

      include: {
        subject: {
          select: {
            name: true,
            slug: true,
          },
        },

        tutor: {
          select: {
            id: true,
            bio: true,
            level: true,
            major: true,
            school: true,
            exp: true,
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
    });

    if (!post) {
      throw new Error("Bài đăng không tồn tại!");
    }

    return post;
  }

  // Hàm tạo bài đăng
  static async create_post(
    userId: string,
    data: {
      topic: string;
      title: string;
      content: string;
      level?: Level;
      grade: number;
      mode: Mode;
      city?: string;
      district?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from: number;
      to: number;
    }
  ) {
    const tutor = await this.get_tutor(userId);

    const post = await prisma.post.create({
      data: {
        owner: tutor.id,
        ...data,
      },
    });

    return post;
  }

  // Hàm sửa bài đăng
  static async update_post(
    userId: string,
    postId: string,
    data: {
      title?: string;
      content?: string;
      level?: Level;
      grade?: number;
      mode?: Mode;
      city?: string;
      district?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from?: number;
      to?: number;
      status?: State;
    }
  ) {
    const tutor = await this.get_tutor(userId);

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.owner !== tutor.id) {
      throw new Error("Bài đăng không tồn tại!");
    }

    const nextFrom = data.from ?? Number(post.from);
    const nextTo = data.to ?? Number(post.to);

    if (nextTo < nextFrom) {
      throw new Error(
        "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu!"
      );
    }

    const payload: Record<string, any> = {};

    if (data.title !== undefined) {
      payload.title = data.title;
    }

    if (data.content !== undefined) {
      payload.content = data.content;
    }

    if (data.level !== undefined) {
      payload.level = data.level;
    }

    if (data.grade !== undefined) {
      payload.grade = data.grade;
    }

    if (data.mode !== undefined) {
      payload.mode = data.mode;
    }

    if (data.city !== undefined) {
      payload.city = data.city;
    }

    if (data.district !== undefined) {
      payload.district = data.district;
    }

    if (data.ward !== undefined) {
      payload.ward = data.ward;
    }

    if (data.street !== undefined) {
      payload.street = data.street;
    }

    if (data.lat !== undefined) {
      payload.lat = data.lat;
    }

    if (data.lng !== undefined) {
      payload.lng = data.lng;
    }

    if (data.from !== undefined) {
      payload.from = data.from;
    }

    if (data.to !== undefined) {
      payload.to = data.to;
    }

    if (data.status !== undefined) {
      payload.status = data.status;
    }

    const updated = await prisma.post.update({
      where: {
        id: postId,
      },

      data: payload,
    });

    return updated;
  }

  // Hàm xoá bài đăng
  static async delete_post(userId: string, postId: string) {
    const tutor = await this.get_tutor(userId);

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post || post.owner !== tutor.id) {
      throw new Error("Bài đăng không tồn tại!");
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
  }
}