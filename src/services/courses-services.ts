import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter });

export class CoursesService {

  // ! Hàm lấy tất cả khóa học
  static async HandleGetAll({ search, page, limit }: { search: string; page: number; limit: number }) {
    const skip = (page - 1) * limit;

    const [courses, items] = await Promise.all([
      prisma.course.findMany({
        where: {
          deleted: null,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
        include: {
          teacherRef: {
            select: { name: true, avatar: true, bio: true, degree: true }
          }
        },
        skip: skip,
        take: limit,
        orderBy: { created: "desc" },
      }),
      
      prisma.course.count({
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
      courses,
      items,
      pages: Math.ceil(items / limit),
    };
  }

  // ! Hàm lấy theo ID 
  static async HandleGetById(id: string, user: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacherRef: {
          select: { name: true, email: true, avatar: true, bio: true, degree: true }
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
        chapters: {
          select: {
            id: true,
            title: true,
            created: true,
            lessons: {
              select: {
                id: true,
                title: true,
                video: true,
                content: true,
                created: true
              }
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

    if (!course || course.deleted) {
      const error = new Error("Không tìm thấy khóa học");
      (error as any).statusCode = 404;
      throw error;
    }

    const isTeacher = course.teacher === user;
    const isStudent = course.members.some(member => member.student === user);

    if (!isTeacher && !isStudent) {
      const maskedChapters = course.chapters.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons.map(lesson => ({
          ...lesson,
          video: null,   
          content: null  
        }))
      }));

      return {
        ...course,
        feed: "",         
        exams: [],        
        members: [],      
        chapters: maskedChapters,
        joined: false
      };
    }

    return {
      ...course,
      joined: true
    };
  }

  // * Hàm tạo mã khóa học tự động * //
  static async GenerateCode(): Promise<string> {
    const part = (length: number) => {
      return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    };
    
    const code = `${part(4)}-${part(3)}-${part(4)}`;
    
    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) return this.GenerateCode(); 
    return code;
  }

  // ! Hàm tạo khóa học
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

    if (user.role === "STUDENT") {
      const error = new Error("Học sinh không có quyền tạo khóa học");
      (error as any).statusCode = 403;
      throw error;
    }

    const code = await this.GenerateCode();

    return await prisma.course.create({
      data: {
        name: data.name,
        code: code,
        description: data.description,
        thumbnail: data.thumbnail,
        feed: data.feed,
        fee: data.fee ?? 0,
        grade: data.grade ?? 1,
        teacher: id,
      },
    });
  }

  // ! Hàm sửa thông tin khóa học
  static async HandleUpdate(id: string, user: string, data: any) {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course || course.deleted) {
      const error = new Error("Không tìm thấy khóa học");
      (error as any).statusCode = 404;
      throw error;
    }

    if (course.teacher !== user) {
      const error = new Error("Bạn không có quyền sửa đổi khóa học này");
      (error as any).statusCode = 403;
      throw error;
    }

    const updated: any = {};

    if (data.name !== undefined) updated.name = data.name;
    if (data.code !== undefined) updated.code = data.code;
    if (data.description !== undefined) updated.description = data.description;
    if (data.thumbnail !== undefined) updated.thumbnail = data.thumbnail;
    if (data.feed !== undefined) updated.feed = data.feed;
    if (data.fee !== undefined) updated.fee = data.fee;
    if (data.grade !== undefined) updated.grade = data.grade;
    if (data.active !== undefined) updated.active = data.active;
    if (data.status !== undefined) updated.status = data.status;

    if (Object.keys(updated).length === 0) {
      return course;
    }

    return await prisma.course.update({
      where: { id },
      data: updated,
    });
  }

  // ! Hàm xóa khóa học
  static async HandleDelete(id: string, user: string) {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course || course.deleted) {
      const error = new Error("Không tìm thấy khóa học");
      (error as any).statusCode = 404;
      throw error;
    }

    if (course.teacher !== user) {
      const error = new Error("Bạn không có quyền sửa đổi khóa học này");
      (error as any).statusCode = 403;
      throw error;
    }

    return await prisma.course.update({
      where: { id },
      data: { deleted: new Date() },
    });
  }
}