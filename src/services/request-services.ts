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
  Venue,
  Slot,
  Unit,
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
    topics?: { subject?: string; custom?: string }[];
    level?: Level;
    grades?: number[];
    mode?: Mode;
    city?: string;
    district?: string;
    minBudget?: number;
    maxBudget?: number;
    ward?: string;
    sort?: "newest" | "highest_price";
    type?: "match" | "all";
  }, userId?: string) {
    const where: Record<string, any> = {
      status: State.OPEN,
    };

    if (filter.type === "match" && userId) {
      const tutor = await prisma.tutor.findUnique({
        where: { user: userId },
        include: { skills: true }
      });

      if (tutor) {
        const orConditions: any[] = [];
        const tutorTopicIds = tutor.skills.map((s) => s.topic).filter(Boolean);
        
        if (tutorTopicIds.length > 0) {
          orConditions.push({
            topics: {
              some: {
                subject: { in: tutorTopicIds }
              }
            }
          });
        }
        
        if (tutor.city) {
          orConditions.push({ city: tutor.city });
        }
        
        if (orConditions.length > 0) {
          where.OR = orConditions;
        }
      }
    }

    if (filter.topics && filter.topics.length > 0) {
      const subjectIds = filter.topics.map(t => t.subject).filter(Boolean);
      const customTopics = filter.topics.map(t => t.custom).filter(Boolean);

      where.topics = {
        some: {
          OR: [
            { subject: { in: subjectIds } },
            { custom: { in: customTopics } },
          ],
        },
      };
    }

    if (filter.level !== undefined) {
      where.level = filter.level;
    }

    if (filter.grades && filter.grades.length > 0) {
      where.grades = {
        hasSome: filter.grades,
      };
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
      // Logic lọc:
      // Tìm các request mà khoảng [from, to] giao với khoảng [minBudget, maxBudget]
      
      const priceFilter: any[] = [];
      
      if (filter.minBudget !== undefined) {
        priceFilter.push({
          to: { gte: filter.minBudget }
        });
      }
      
      if (filter.maxBudget !== undefined) {
        priceFilter.push({
          from: { lte: filter.maxBudget }
        });
      }
      
      if (priceFilter.length > 0) {
        where.AND = [
          ...(where.AND || []),
          ...priceFilter
        ];
      }
    }

    const [total, rows] = await Promise.all([
      prisma.request.count({
        where,
      }),

      prisma.request.findMany({
        where,

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

        orderBy: {
          created: "desc",
        },

        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
    ]);

    let savedRequestIds = new Set<string>();
    if (userId) {
      try {
        const tutor = await prisma.tutor.findUnique({ where: { user: userId } });
        if (tutor && rows.length > 0) {
          const saved = await prisma.savedRequest.findMany({
            where: {
              owner: tutor.id,
              need: { in: rows.map(r => r.id) }
            },
            select: { need: true }
          });
          saved.forEach(s => savedRequestIds.add(s.need));
        }
      } catch (e) {
        // ignore
      }
    }

    return {
      items: rows.map(r => ({ ...r, saved: savedRequestIds.has(r.id) })),
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
            id: true,
            city: true,
            ward: true,

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
      topics: { subject?: string; custom?: string }[];
      title: string;
      desc: string;
      level?: Level;
      grades: number[];
      mode: Mode;
      city?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from: number;
      to: number;
      unit: Unit;
      count?: number;
      venue?: Venue;
      flexible?: boolean;
      days?: number[];
      slot?: Slot;
      startTime?: string;
      endTime?: string;
    }
  ) {
    const student = await this.get_student(userId);

    const request = await prisma.request.create({
      data: {
        learner: student.id,
        ...data,
        topics: {
          create: data.topics.map((t) => ({
            subject: t.subject || null,
            custom: t.custom || null,
          })),
        },
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
      grades?: number[];
      mode?: Mode;
      city?: string;
      ward?: string;
      street?: string;
      lat?: number;
      lng?: number;
      from?: number;
      to?: number;
      unit?: Unit;
      count?: number;
      venue?: Venue;
      flexible?: boolean;
      days?: number[];
      slot?: Slot;
      startTime?: string;
      endTime?: string;
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

    if (data.grades !== undefined) {
      payload.grades = data.grades;
    }

    if (data.mode !== undefined) {
      payload.mode = data.mode;
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

    if (data.count !== undefined) payload.count = data.count;
    if (data.flexible !== undefined) payload.flexible = data.flexible;
    if (data.days !== undefined) payload.days = data.days;
    if (data.slot !== undefined) payload.slot = data.slot;
    if (data.startTime !== undefined) payload.startTime = data.startTime;
    if (data.endTime !== undefined) payload.endTime = data.endTime;
    if (data.venue !== undefined) payload.venue = data.venue;
    if (data.status !== undefined) payload.status = data.status;

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