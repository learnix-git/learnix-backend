import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

export const ClassroomService = {
  // Hàm lấy danh sách lớp học
  async HandleGetAll() {
    try {
      const classroom = await prisma.classroom.findMany({
        orderBy: { created: "desc" },
        include: {
          _count: {
            select: { members: true }, 
          },
          teacherRef: { 
            select: {
              name: true,
            }
          }
        },
      });

      return classroom.map((c) => ({
        ...c,
        count: c._count.members,
        price: c.fee > 0 ? `${c.fee.toLocaleString("vi-VN")} đ` : "Miễn phí",
        name: c.teacherRef?.name || "Giảng viên Learnix",
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Hàm lấy lớp học theo ID
  async HandleGetById(ID: string) {
    try {
      const classroom = await prisma.classroom.findUnique({
        where: {
          id: ID,
        },
        include: {
          exams: true,    
          teacherRef: true,
          members: {
            include: {
              studentRef: true,
            }
          },
        }
      });

      if (!classroom) {
        return null;
      }

      return {
        ...classroom,
        feed: classroom.feed || [],
        exams: classroom.exams || [],
        teacherName: classroom.teacherRef?.name || "Không có tên",
        teacherAvatar: classroom.teacherRef?.avatar || null,
        members: (classroom.members || []).map((m: any) => ({
          id: m.id,
          email: m.studentRef?.email || "",
          name: m.studentRef?.name || "Học viên",
          avatar: m.studentRef?.avatar || null,
          joinedAt: m.joined,
        })),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  
  // Hàm tạo mã lớp học tự động
  async GenerateCode(): Promise<string> {
    const part = (length: number) => {
      return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    };
    
    const code = `${part(4)}-${part(3)}-${part(4)}`;
    
    // Kiểm tra trùng
    const existing = await prisma.classroom.findUnique({ where: { code } });
    if (existing) return this.GenerateCode(); 
    return code;
  },

  async HandleCreate(id: string, data: { 
    name: string; code: string; description?: string; 
    fee: number; grade: number; capacity?: number 
  }) {
    try {
      const code = await this.GenerateCode();

      return await prisma.classroom.create({
        data: {
          name: data.name,
          code: code,
          description: data.description || null,
          teacher: id,
          fee: data.fee || 0,
          grade: data.grade || 1,
          capacity: data.capacity || 50,
          active: true,
          feed: "[]"
        }
      });
    } 
    catch (error) {
      console.error(error);
      throw error;
    }
  } 
};