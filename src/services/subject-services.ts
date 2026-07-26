// GET /api/v1/subjects

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class SubjectService {
  // Hàm lấy danh sách môn học
  static async get_subjects(filter: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const where: Record<string, any> = {};

    if (filter.search !== undefined) {
      where.name = {
        contains: filter.search,
        mode: "insensitive",
      };
    }

    const [total, rows] = await Promise.all([
      prisma.subject.count({
        where,
      }),

      prisma.subject.findMany({
        where,

        select: {
          id: true,
          name: true,
          slug: true,
        },

        orderBy: {
          name: "asc",
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
}