// GET    /api/v1/requests 
// GET    /api/v1/requests/:id
// POST   /api/v1/requests
// PATCH  /api/v1/requests/:id
// DELETE /api/v1/requests/:id 

import {
  PrismaClient,
  Level,
  Mode,
  State,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class RequestService {
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

  // Hàm lấy danh sách yêu cầu
  static async get_requests(filter: {
    page: number;
    limit: number;
    topic?: string;
    level?: Level;
    grade?: number;
    mode?: Mode;
    city?: string;
    district?: string;
    minBudget?: number;
    maxBudget?: number;
  }) {
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

    if (
      filter.minBudget !== undefined ||
      filter.maxBudget !== undefined
    ) {
      where.budget = {};

      if (filter.minBudget !== undefined) {
        where.budget.gte = filter.minBudget;
      }

      if (filter.maxBudget !== undefined) {
        where.budget.lte = filter.maxBudget;
      }
    }

    const [total, rows] = await Promise.all([
      prisma.request.count({
        where,
      }),

      prisma.request.findMany({
        where,

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

  // Hàm lấy chi tiết 1 yêu cầu
  static async get_request(requestId: string) {
    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },

      include: {
        subject: {
          select: {
            name: true,
            slug: true,
          },
        },

        student: {
          select: {
            id: true,
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
    });

    if (!request) {
      throw new Error("Yêu cầu không tồn tại!");
    }

    return request;
  }

    // Hàm tạo yêu cầu
  static async create_request(
    userId: string,
    data: {
      topic: string;
      title: string;
      desc: string;
      level?: Level;
      grade: number;
      mode: Mode;
      city?: string;
      district?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      budget: number;
      count?: number;
      schedule?: string;
    }
  ) {
    const student = await this.get_student(userId);

    const request = await prisma.request.create({
      data: {
        learner: student.id,
        ...data,
      },
    });

    return request;
  }

  // Hàm sửa yêu cầu
  static async update_request(
    userId: string,
    requestId: string,
    data: {
      title?: string;
      desc?: string;
      level?: Level;
      grade?: number;
      mode?: Mode;
      city?: string;
      district?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      budget?: number;
      count?: number;
      schedule?: string;
      status?: State;
    }
  ) {
    const student = await this.get_student(userId);

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request || request.learner !== student.id) {
      throw new Error("Yêu cầu không tồn tại!");
    }

    const payload: Record<string, any> = {};

    if (data.title !== undefined) {
      payload.title = data.title;
    }

    if (data.desc !== undefined) {
      payload.desc = data.desc;
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

    if (data.budget !== undefined) {
      payload.budget = data.budget;
    }

    if (data.count !== undefined) {
      payload.count = data.count;
    }

    if (data.schedule !== undefined) {
      payload.schedule = data.schedule;
    }

    if (data.status !== undefined) {
      payload.status = data.status;
    }

    const updated = await prisma.request.update({
      where: {
        id: requestId,
      },

      data: payload,
    });

    return updated;
  }

  // Hàm xoá yêu cầu
  static async delete_request(
    userId: string,
    requestId: string
  ) {
    const student = await this.get_student(userId);

    const request = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request || request.learner !== student.id) {
      throw new Error("Yêu cầu không tồn tại!");
    }

    await prisma.request.delete({
      where: {
        id: requestId,
      },
    });
  }
}