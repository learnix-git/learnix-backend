// GET    /api/v1/follows
// POST   /api/v1/follows
// DELETE /api/v1/follows/:tutorId

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class FollowService {
  // Hàm quy đổi userId sang studentId
  private static async get_student(userId: string) {
    const student = await prisma.student.findUnique({
      where: {
        user: userId,
      },
    });

    if (!student) {
      throw new Error("Bạn chưa có hồ sơ học sinh/phụ huynh!");
    }

    return student;
  }

  // Hàm lấy danh sách tutor đã follow
  static async get_follows(
    userId: string,
    page: number,
    limit: number
  ) {
    const student = await this.get_student(userId);

    const [total, rows] = await Promise.all([
      prisma.follow.count({
        where: {
          learner: student.id,
        },
      }),

      prisma.follow.findMany({
        where: {
          learner: student.id,
        },

        include: {
          teacher: {
            select: {
              id: true,
              bio: true,
              level: true,
              major: true,
              school: true,
              rating: true,
              reviews: true,
              city: true,
              district: true,

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

  // Hàm follow 1 tutor
  static async create_follow(
    userId: string,
    tutorId: string
  ) {
    const student = await this.get_student(userId);

    const tutor = await prisma.tutor.findUnique({
      where: {
        id: tutorId,
      },
    });

    if (!tutor) {
      throw new Error("Gia sư không tồn tại!");
    }

    const exist = await prisma.follow.findUnique({
      where: {
        learner_tutor: {
          learner: student.id,
          tutor: tutorId,
        },
      },
    });

    if (exist) {
      throw new Error("Bạn đã theo dõi gia sư này rồi!");
    }

    const follow = await prisma.follow.create({
      data: {
        learner: student.id,
        tutor: tutorId,
      },
    });

    return follow;
  }

  // Hàm unfollow 1 tutor
  static async delete_follow(
    userId: string,
    tutorId: string
  ) {
    const student = await this.get_student(userId);

    const follow = await prisma.follow.findUnique({
      where: {
        learner_tutor: {
          learner: student.id,
          tutor: tutorId,
        },
      },
    });

    if (!follow) {
      throw new Error("Bạn chưa theo dõi gia sư này!");
    }

    await prisma.follow.delete({
      where: {
        learner_tutor: {
          learner: student.id,
          tutor: tutorId,
        },
      },
    });
  }
}