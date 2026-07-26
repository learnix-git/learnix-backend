// GET    /api/v1/reviews/tutor/:id
// POST   /api/v1/reviews
// DELETE /api/v1/reviews/:id

import {
  PrismaClient,
  State,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class ReviewService {
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

  // Hàm tính lại rating trung bình + số lượng review của 1 tutor
  private static async recalc_rating(tutorId: string) {
    const agg = await prisma.review.aggregate({
      where: {
        tutor: tutorId,
      },

      _avg: {
        rating: true,
      },

      _count: {
        rating: true,
      },
    });

    await prisma.tutor.update({
      where: {
        id: tutorId,
      },

      data: {
        rating: agg._avg.rating ?? 0,
        reviews: agg._count.rating,
      },
    });
  }

  // Hàm lấy danh sách review của 1 tutor
  static async get_reviews(
    tutorId: string,
    page: number,
    limit: number
  ) {
    const [total, rows] = await Promise.all([
      prisma.review.count({
        where: {
          tutor: tutorId,
        },
      }),

      prisma.review.findMany({
        where: {
          tutor: tutorId,
        },

        include: {
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

  // Hàm tạo review
  static async create_review(
    userId: string,
    data: {
      contractId: string;
      rating: number;
      content?: string;
    }
  ) {
    const student = await this.get_student(userId);

    // Kiểm tra hợp đồng
    const contract = await prisma.contract.findUnique({
      where: {
        id: data.contractId,
      },
    });

    if (!contract || contract.learner !== student.id) {
      throw new Error("Hợp đồng không tồn tại!");
    }

    if (contract.status !== State.DONE) {
      throw new Error(
        "Chỉ được đánh giá sau khi hợp đồng đã hoàn thành!"
      );
    }

    // Kiểm tra hợp đồng đã được đánh giá chưa
    const exist = await prisma.review.findUnique({
      where: {
        deal: contract.id,
      },
    });

    if (exist) {
      throw new Error("Hợp đồng này đã được đánh giá!");
    }

    const review = await prisma.review.create({
      data: {
        learner: student.id,
        tutor: contract.tutor,
        deal: contract.id,
        rating: data.rating,
        content: data.content,
      },
    });

    // Tính lại rating trung bình cho tutor
    await this.recalc_rating(contract.tutor);

    return review;
  }

  // Hàm xoá review
  static async delete_review(
    userId: string,
    reviewId: string
  ) {
    const student = await this.get_student(userId);

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review || review.learner !== student.id) {
      throw new Error("Đánh giá không tồn tại!");
    }

    const tutorId = review.tutor;

    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    // Tính lại rating trung bình cho tutor sau khi xoá
    await this.recalc_rating(tutorId);
  }
}