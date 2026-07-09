import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

export const ClassroomService = {
  async get_classroom(id?: string) {
    const condition = id 
      ? { teacher: id } 
      : { active: true };
    
    const classes = await prisma.classroom.findMany({
      where: condition,
      orderBy: { created: "desc" },
      include: {
        _count: {
          select: { members: true }, 
        },
      },
    });

    return classes.map((c) => ({
      ...c,
      count: c._count.members,
      price: c.fee > 0 ? `${c.fee.toLocaleString("vi-VN")} đ` : "Miễn phí",
    }));
  },
  
  async create_classroom(id: string, data: { 
    name: string; code: string; description?: string; 
    fee: number; grade: number; capacity?: number 
  }) {
    return await prisma.classroom.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        teacher: id,
        fee: data.fee || 0,
        grade: data.grade || 1,
        capacity: data.capacity || 50,
        active: true
      }
    });
  }
};