// GET    /api/v1/tutor/skills
// POST   /api/v1/tutor/skills
// DELETE /api/v1/tutor/skills/:topic

// GET    /api/v1/tutor/degrees
// POST   /api/v1/tutor/degrees
// DELETE /api/v1/tutor/degrees/:id

// GET    /api/v1/tutor/history
// POST   /api/v1/tutor/history
// PATCH  /api/v1/tutor/history/:id
// DELETE /api/v1/tutor/history/:id

// GET    /api/v1/tutor/schedule
// PUT    /api/v1/tutor/schedule 

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const FOLDER = 'Learnix/Tutor';

export class TutorService {
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

  // Hàm đăng tải tệp
  private static async upload_file(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }) {
    const isImage = file.mimetype.startsWith("image/");

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER,
          resource_type: isImage ? "image" : "raw",
          filename_override: file.originalname,
          use_filename: true,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            return reject(error || new Error("Đăng tải tệp thất bại!"));
          }
          resolve(uploaded);
        }
      );
      stream.end(file.buffer);
    });

    return result.secure_url;
  }

  // Hàm lấy danh sách kinh nghiệm
  static async get_history(userId: string) {
    const tutor = await this.get_tutor(userId);

    const history = await prisma.history.findMany({
      where: {
        owner: tutor.id,
      },
      orderBy: {
        start: "desc",
      },
    });

    return history;
  }

  // Hàm thêm kinh nghiệm
  static async create_history(
    userId: string,
    data: { title: string; place: string; start: number; end?: number; desc?: string }
  ) {
    const tutor = await this.get_tutor(userId);

    const history = await prisma.history.create({
      data: {
        owner: tutor.id,
        title: data.title,
        place: data.place,
        start: data.start,
        end: data.end,
        desc: data.desc,
      },
    });

    return history;
  }

  // Hàm sửa kinh nghiệm
  static async update_history(
    userId: string,
    historyId: string,
    data: { title?: string; place?: string; start?: number; end?: number; desc?: string }
  ) {
    const tutor = await this.get_tutor(userId);

    const history = await prisma.history.findUnique({
      where: {
        id: historyId,
      },
    });

    if (!history || history.owner !== tutor.id) {
      throw new Error("Kinh nghiệm không tồn tại!");
    }

    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.place !== undefined) payload.place = data.place;
    if (data.start !== undefined) payload.start = data.start;
    if (data.end !== undefined) payload.end = data.end;
    if (data.desc !== undefined) payload.desc = data.desc;

    const updated = await prisma.history.update({
      where: {
        id: historyId,
      },
      data: payload,
    });

    return updated;
  }

  // Hàm xoá kinh nghiệm
  static async delete_history(userId: string, historyId: string) {
    const tutor = await this.get_tutor(userId);

    const history = await prisma.history.findUnique({
      where: {
        id: historyId,
      },
    });

    if (!history || history.owner !== tutor.id) {
      throw new Error("Kinh nghiệm không tồn tại!");
    }

    await prisma.history.delete({
      where: {
        id: historyId,
      },
    });
  }

  // Hàm lấy lịch dạy trong tuần
  static async get_schedule(userId: string) {
    const tutor = await this.get_tutor(userId);

    const schedule = await prisma.schedule.findMany({
      where: {
        owner: tutor.id,
      },
      orderBy: {
        day: "asc",
      },
    });

    return schedule;
  }

  // Hàm thay thế toàn bộ lịch dạy trong tuần
  static async update_schedule(
    userId: string,
    slots: { day: number; start: string; end: string; active?: boolean }[]
  ) {
    const tutor = await this.get_tutor(userId);

    // Xoá lịch cũ và tạo lại toàn bộ trong 1 transaction
    await prisma.$transaction([
      prisma.schedule.deleteMany({
        where: {
          owner: tutor.id,
        },
      }),
      prisma.schedule.createMany({
        data: slots.map((slot) => ({
          owner: tutor.id,
          day: slot.day,
          start: slot.start,
          end: slot.end,
          active: slot.active ?? true,
        })),
      }),
    ]);

    return this.get_schedule(userId);
  }
}