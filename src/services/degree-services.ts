// GET    /api/v1/degrees
// POST   /api/v1/degrees
// DELETE /api/v1/degrees/:id

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

export class DegreeService {
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

  static async get_degrees(userId: string) {
    const tutor = await this.get_tutor(userId);

    const degrees = await prisma.degree.findMany({
      where: {
        owner: tutor.id,
      },
      orderBy: {
        created: "desc",
      },
    });

    return degrees;
  }

  static async create_degree(
    userId: string,
    data: { name: string; type: string; score?: string; issuer?: string; year?: number },
    file: { buffer: Buffer; originalname: string; mimetype: string }
  ) {
    const tutor = await this.get_tutor(userId);

    const url = await this.upload_file(file);

    const degree = await prisma.degree.create({
      data: {
        owner: tutor.id,
        name: data.name,
        type: data.type,
        score: data.score,
        issuer: data.issuer,
        year: data.year,
        url,
      },
    });

    return degree;
  }

  static async delete_degree(userId: string, degreeId: string) {
    const tutor = await this.get_tutor(userId);

    const degree = await prisma.degree.findUnique({
      where: {
        id: degreeId,
      },
    });

    if (!degree || degree.owner !== tutor.id) {
      throw new Error("Bằng cấp không tồn tại!");
    }

    await prisma.degree.delete({
      where: {
        id: degreeId,
      },
    });
  }
}
