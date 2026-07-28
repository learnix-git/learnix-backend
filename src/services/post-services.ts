// GET    /api/v1/posts
// GET    /api/v1/posts/:id
// POST   /api/v1/posts
// PATCH  /api/v1/posts/:id
// DELETE /api/v1/posts/:id

import {
  PrismaClient,
  Level,
  Mode,
  Venue,
  Unit,
  Slot,
  State,
} from '@prisma/client';
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
    ward?: string;
    minPrice?: number;
    maxPrice?: number;
    unit?: Unit;
    sort?: string;
  }, userId?: string) {
    const where: Record<string, any> = {
      status: State.OPEN,
    };

    if (filter.topic !== undefined) {
      where.topics = {
        some: {
          subject: filter.topic,
        },
      };
    }

    if (filter.level !== undefined) {
      where.level = filter.level;
    }

    if (filter.grade !== undefined) {
      where.grades = {
        has: filter.grade,
      };
    }

    if (filter.mode !== undefined) {
      where.mode = filter.mode;
    }

    if (filter.city !== undefined) {
      where.city = filter.city;
    }

    if (filter.ward !== undefined) {
      where.ward = filter.ward;
    }

    if (filter.unit !== undefined) {
      where.unit = filter.unit;
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

    const [total, rows] = await Promise.all([
      prisma.post.count({
        where,
      }),

      prisma.post.findMany({
        where,

        include: {
          topics: {
            select: {
              custom: true,

              topic: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },

          times: {
            select: {
              day: true,
              slot: true,
              start: true,
              end: true,
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
          ...(userId ? {
            savedBy: {
              where: { user: userId },
              select: { id: true }
            }
          } : {})
        },

      orderBy: (() => {
          if (filter.sort === "oldest") return { created: "asc" };
          if (filter.sort === "rating-high") return { tutor: { rating: "desc" } };
          if (filter.sort === "price-low") return { from: "asc" };
          if (filter.sort === "price-high") return { from: "desc" };
          return { created: "desc" };
        })(),

        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
    ]);

    return {
      items: rows.map(r => ({
        ...r,
        saved: userId ? (r as any).savedBy?.length > 0 : false,
      })),
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  // Hàm lấy chi tiết 1 bài đăng
  static async get_post(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },

      include: {
        topics: {
          select: {
            custom: true,

            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },

        times: {
          select: {
            day: true,
            slot: true,
            start: true,
            end: true,
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
          ...(userId ? {
            savedBy: {
              where: { user: userId },
              select: { id: true }
            }
          } : {})
        },
      },
    });

    if (!post) {
      throw new Error("Bài đăng không tồn tại!");
    }

    return {
      ...post,
      saved: userId ? (post as any).savedBy?.length > 0 : false,
    };
  }

  // Hàm tạo bài đăng
  static async create_post(
    userId: string,
    data: {
      topics: (
        | { subject: string }
        | { custom: string }
      )[];

      times?: {
        day: number;
        slot: Slot;
        start: string;
        end: string;
      }[];

      title: string;
      content: string;
      level?: Level;
      grades: number[];
      mode: Mode;
      venue?: Venue;
      city?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from: number;
      to: number;
      hours?: number;
      unit?: Unit;
      flexible?: boolean;
    }
  ) {
    const tutor = await this.get_tutor(userId);

    const {
      topics,
      times,
      ...rest
    } = data;

    const post = await prisma.post.create({
      data: {
        owner: tutor.id,

        ...rest,

        hours: rest.unit === "PER_SESSION" ? rest.hours : null,

        venue:
          rest.mode === "OFFLINE"
            ? rest.venue
            : null,

        topics: {
          create: topics.map((t) =>
            "subject" in t
              ? {
                subject: t.subject,
              }
              : {
                custom: t.custom,
              }
          ),
        },

        times: times
          ? {
            create: times.map((t) => ({
              day: t.day,
              slot: t.slot,
              start: t.start,
              end: t.end,
            })),
          }
          : undefined,
      },

      include: {
        topics: {
          select: {
            custom: true,

            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },

        times: {
          select: {
            day: true,
            slot: true,
            start: true,
            end: true,
          },
        },
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

      topics?: (
        | { subject: string }
        | { custom: string }
      )[];

      times?: {
        day: number;
        slot: Slot;
        start: string;
        end: string;
      }[];

      level?: Level;
      grades?: number[];
      mode?: Mode;
      venue?: Venue;
      city?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from?: number;
      to?: number;
      hours?: number;
      unit?: Unit;
      status?: State;
      flexible?: boolean;
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

    if (data.topics !== undefined) {
      payload.topics = {
        deleteMany: {},

        create: data.topics.map((t) =>
          "subject" in t
            ? {
              subject: t.subject,
            }
            : {
              custom: t.custom,
            }
        ),
      };
    }

    if (data.times !== undefined) {
      payload.times = {
        deleteMany: {},

        create: data.times.map((t) => ({
          day: t.day,
          slot: t.slot,
          start: t.start,
          end: t.end,
        })),
      };
    }

    if (data.level !== undefined) {
      payload.level = data.level;
    }

    if (data.grades !== undefined) {
      payload.grades = data.grades;
    }

    if (data.mode !== undefined) {
      payload.mode = data.mode;
    }

    if (data.mode === "ONLINE") {
      payload.venue = null;
    }

    if (data.venue !== undefined) {
      payload.venue = data.venue;
    }

    if (data.hours !== undefined) {
      payload.hours = data.hours;
    }

    if (data.unit === "PER_MONTH") {
      payload.hours = null;
    }

    if (data.city !== undefined) {
      payload.city = data.city;
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

    if (data.unit !== undefined) {
      payload.unit = data.unit;
    }

    if (data.status !== undefined) {
      payload.status = data.status;
    }

    if (data.flexible !== undefined) {
      payload.flexible = data.flexible;
    }

    const updated = await prisma.post.update({
      where: {
        id: postId,
      },

      data: payload,

      include: {
        topics: {
          select: {
            custom: true,

            topic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },

        times: {
          select: {
            day: true,
            slot: true,
            start: true,
            end: true,
          },
        },
      },
    });

    return updated;
  }

  // Hàm xoá bài đăng
  static async delete_post(
    userId: string,
    postId: string
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

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
  }
}