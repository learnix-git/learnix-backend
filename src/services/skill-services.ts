import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export class SkillService {
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

  static async get_skills(userId: string) {
    const tutor = await this.get_tutor(userId);

    const skills = await prisma.skill.findMany({
      where: {
        owner: tutor.id,
      },
      include: {
        subject: {
          select: { name: true, slug: true },
        },
      },
    });

    return skills;
  }

  static async create_skill(
    userId: string,
    data: { topic: string; grades: number[] }
  ) {
    const tutor = await this.get_tutor(userId);

    const exist = await prisma.skill.findUnique({
      where: {
        owner_topic: {
          owner: tutor.id,
          topic: data.topic,
        },
      },
    });

    if (exist) {
      throw new Error("Môn học này đã được thêm!");
    }

    const skill = await prisma.skill.create({
      data: {
        owner: tutor.id,
        topic: data.topic,
        grades: data.grades,
      },
    });

    return skill;
  }

  static async delete_skill(userId: string, topic: string) {
    const tutor = await this.get_tutor(userId);

    const skill = await prisma.skill.findUnique({
      where: {
        owner_topic: {
          owner: tutor.id,
          topic,
        },
      },
    });

    if (!skill) {
      throw new Error("Môn học không tồn tại!");
    }

    await prisma.skill.delete({
      where: {
        owner_topic: {
          owner: tutor.id,
          topic,
        },
      },
    });
  }
}
