import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

export class ClassroomService {

  // ! Hàm lấy tất cả
  static async HandleGetAll({ search, page, limit }: { search: string; page: number; limit: number }) {
    const skip = (page - 1) * limit;

    const [classrooms, items] = await Promise.all([
      prisma.classroom.findMany({
        where: {
          deleted: null,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } }
          ],
        },
        include: {
          teacherRef: {
            select: { name: true, avatar: true }
          }
        },
        skip: skip,
        take: limit,
        orderBy: { created: "desc" },
      }),
      
      prisma.classroom.count({
        where: {
          deleted: null,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return {
      classrooms,
      items,
      pages: Math.ceil(items / limit),
    };
  }

  // ! Hàm lấy theo ID
  static async HandleGetById(id: string, user: string) {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacherRef: {
          select: { name: true, email: true, avatar: true }
        },
        members: {
          select: {
            id: true,
            student: true,
            studentRef: {
              select: { name: true, avatar: true }
            }
          }
        },
        exams: {
          where: { deleted: null },
          select: {
            id: true,
            title: true,
            duration: true,
            status: true,
            start: true,
            end: true
          }
        }
      }
    });

    if (!classroom || classroom.deleted) {
      const error = new Error("Không tìm thấy lớp học");
      (error as any).statusCode = 404;
      throw error;
    }

    // Kiểm tra xem user có phải giáo viên không
    const isTeacher = classroom.teacher === user;

    // Kiểm tra xem user có phải học sinh không
    const isStudent = classroom.members.some(member => member.student === user);

    if (!isTeacher && !isStudent) {
      return {
        ...classroom,
        feed: "",         
        exams: [],        
        members: [],      
        joined: false
      };
    }

    return {
      ...classroom,
      joined: true
    };
  }

  // * Hàm tạo mã lớp học tự động * //
  static async GenerateCode(): Promise<string> {
    const part = (length: number) => {
      return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    };
    
    const code = `${part(4)}-${part(3)}-${part(4)}`;
    
    // Kiểm tra trùng
    const existing = await prisma.classroom.findUnique({ where: { code } });
    if (existing) return this.GenerateCode(); 
    return code;
  }

  // ! Hàm tạo lớp học
  static async HandleCreate(id: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { role: true, active: true }
    });

    if (!user || !user.active) {
      const error = new Error("Tài khoản không tồn tại hoặc đã bị khóa");
      (error as any).statusCode = 404;
      throw error;
    }

    // Chặn gọi API nếu là học sinh
    if (user.role === "STUDENT") {
      const error = new Error("Học sinh không có quyền tạo lớp học");
      (error as any).statusCode = 403;
      throw error;
    }

    const code = await this.GenerateCode();

    // Tạo lớp nếu là giáo viên
    return await prisma.classroom.create({
      data: {
        name: data.name,
        code: code,
        description: data.description,
        address: data.address,
        feed: data.feed,
        fee: data.fee ?? 0,
        capacity: data.capacity ?? 50,
        teacher: id,
      },
    });
  }

  // ! Hàm sửa thông tin lớp học
  static async HandleUpdate(id: string, user: string, data: any) {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom || classroom.deleted) {
      const error = new Error("Không tìm thấy lớp học");
      (error as any).statusCode = 404;
      throw error;
    }

    if (classroom.teacher !== user) {
      const error = new Error("Bạn không có quyền sửa đổi lớp học này");
      (error as any).statusCode = 403;
      throw error;
    }

    const updated: any = {};

    if (data.name !== undefined) updated.name = data.name;
    if (data.code !== undefined) updated.code = data.code;
    if (data.description !== undefined) updated.description = data.description;
    if (data.feed !== undefined) updated.feed = data.feed;
    if (data.fee !== undefined) updated.fee = data.fee;
    if (data.capacity !== undefined) updated.capacity = data.capacity;
    if (data.active !== undefined) updated.active = data.active;
    if (data.status !== undefined) updated.status = data.status;
    if (data.address !== undefined) updated.address = data.address;

    if (Object.keys(updated).length === 0) {
      return classroom;
    }

    return await prisma.classroom.update({
      where: { id },
      data: updated,
    });
  }

  // ! Hàm xóa lớp học
  static async HandleDelete(id: string, user: string) {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom || classroom.deleted) {
      const error = new Error("Không tìm thấy lớp học");
      (error as any).statusCode = 404;
      throw error;
    }

    if (classroom.teacher !== user) {
      const error = new Error("Bạn không có quyền sửa đổi lớp học này");
      (error as any).statusCode = 403;
      throw error;
    }

    return await prisma.classroom.update({
      where: { id },
      data: { deleted: new Date() },
    });
  }
}