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

const FOLDER = 'Home/Learnix/Chat';

type Payload =
  | { type: 'text'; content: string }
  | { type: 'image' | 'file'; attachmentId: string; content?: string };

export class ChatService {
  // ! Kiểm tra user có phải thành viên cuộc trò chuyện không
  static async check_role(conversationId: string, userId: string) {
    const chat = await prisma.chat.findUnique({ where: { id: conversationId } });

    if (!chat) {
      throw new Error("Cuộc trò chuyện không tồn tại!");
    }
    if (chat.user1 !== userId && chat.user2 !== userId) {
      throw new Error("Bạn không có quyền truy cập cuộc trò chuyện này!");
    }
    return chat;
  }

  // ! Chuẩn hóa User -> ChatUser
  private static map_user(user: { id: string; name: string; avatar: string | null; role: string }) {
    return { id: user.id, name: user.name, avatar: user.avatar, alias: null, role: user.role };
  }

  // ! Chuẩn hóa Attachment -> ChatAttachment
  private static map_attachment(att: { id: string; name: string; mime: string; size: number; url: string } | null) {
    if (!att) return null;
    return { id: att.id, originalName: att.name, mimeType: att.mime, sizeBytes: att.size, url: att.url };
  }

  // ! Chuẩn hóa Message -> ChatMessage
  private static map_message(msg: any) {
    return {
      id: msg.id,
      conversationId: msg.room,
      sender: this.map_user(msg.user),
      type: msg.type.toLowerCase(),
      content: msg.content,
      attachment: this.map_attachment(msg.attachment),
      createdAt: msg.created.toISOString(),
    };
  }

  // ! Preview cho danh sách hội thoại
  private static get_preview(type: string, content: string | null) {
    if (type === "TEXT" || type === "SYSTEM") return content || "";
    if (type === "IMAGE") return "Hình ảnh";
    return "Tệp đính kèm";
  }

  // ! Danh sách cuộc trò chuyện của user
  static async get_conversations(userId: string, type?: "direct" | "course") {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1: userId }, { user2: userId }],
        ...(type ? { type: type.toUpperCase() as any } : {}),
      },
      include: {
        first: { select: { id: true, name: true, avatar: true, role: true } },
        second: { select: { id: true, name: true, avatar: true, role: true } },
        course: { select: { id: true, code: true, name: true, slug: true, thumb: true, price: true } },
        messages: { orderBy: { created: "desc" }, take: 1 },
      },
      orderBy: { updated: "desc" },
    });

    return Promise.all(
      chats.map(async (chat) => {
        const peerUser = chat.user1 === userId ? chat.second : chat.first;
        const readAt = chat.user1 === userId ? chat.read1 : chat.read2;

        const unreadCount = await prisma.message.count({
          where: {
            room: chat.id,
            sender: { not: userId },
            ...(readAt ? { created: { gt: readAt } } : {}),
          },
        });

        const last = chat.messages[0] ?? null;

        return {
          id: chat.id,
          type: chat.type.toLowerCase(),
          course: chat.course
            ? {
                id: chat.course.id,
                code: chat.course.code,
                name: chat.course.name,
                slug: chat.course.slug,
                grade: null,
                thumbnail: chat.course.thumb,
                price: chat.course.price ? Number(chat.course.price) : null,
              }
            : null,
          peer: this.map_user(peerUser),
          lastMessageAt: last ? last.created.toISOString() : null,
          lastMessagePreview: last ? this.get_preview(last.type, last.content) : null,
          unreadCount,
        };
      })
    );
  }

  // ! Lấy tin nhắn phân trang
  static async get_messages(conversationId: string, userId: string, page: number, size: number) {
    await this.check_role(conversationId, userId);

    const [total, rows] = await Promise.all([
      prisma.message.count({ where: { room: conversationId } }),
      prisma.message.findMany({
        where: { room: conversationId },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
          attachment: true,
        },
        orderBy: { created: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return { items: rows.reverse().map((m) => this.map_message(m)), total };
  }

  // ! Tạo tin nhắn — dùng chung cho REST và socket
  static async post_message(conversationId: string, senderId: string, payload: Payload) {
    await this.check_role(conversationId, senderId);

    let attachmentId: string | null = null;

    if (payload.type !== "text") {
      const attachment = await prisma.attachment.findUnique({ where: { id: payload.attachmentId } });
      if (!attachment) {
        throw new Error("Tệp đính kèm không tồn tại!");
      }
      if (attachment.owner !== senderId) {
        throw new Error("Bạn không có quyền dùng tệp đính kèm này!");
      }

      const used = await prisma.message.findUnique({ where: { attach: attachment.id } });
      if (used) {
        throw new Error("Tệp đính kèm đã được sử dụng cho tin nhắn khác!");
      }

      attachmentId = attachment.id;
    }

    const message = await prisma.message.create({
      data: {
        room: conversationId,
        sender: senderId,
        type: payload.type.toUpperCase() as any,
        content: payload.type === "text" ? payload.content : (payload.content ?? null),
        attach: attachmentId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        attachment: true,
      },
    });

    await prisma.chat.update({ where: { id: conversationId }, data: { updated: new Date() } });

    return this.map_message(message);
  }

  // ! Đánh dấu đã đọc — lưu mốc thời gian
  static async mark_as_read(conversationId: string, readerId: string, messageId: string) {
    const chat = await this.check_role(conversationId, readerId);

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.room !== conversationId) {
      throw new Error("Tin nhắn không tồn tại trong cuộc trò chuyện này!");
    }

    const field = chat.user1 === readerId ? "read1" : "read2";
    await prisma.chat.update({
      where: { id: conversationId },
      data: { [field]: message.created },
    });
  }

  // ! Đếm tổng số tin nhắn chưa đọc, gộp theo từng cuộc trò chuyện
  static async count_unread(userId: string) {
    const chats = await prisma.chat.findMany({
      where: { OR: [{ user1: userId }, { user2: userId }] },
    });

    let total = 0;
    const items: { conversationId: string; count: number; latestAt: string }[] = [];

    for (const chat of chats) {
      const readAt = chat.user1 === userId ? chat.read1 : chat.read2;

      const [count, last] = await Promise.all([
        prisma.message.count({
          where: {
            room: chat.id,
            sender: { not: userId },
            ...(readAt ? { created: { gt: readAt } } : {}),
          },
        }),
        prisma.message.findFirst({ where: { room: chat.id }, orderBy: { created: "desc" } }),
      ]);

      if (count > 0 && last) {
        items.push({ conversationId: chat.id, count, latestAt: last.created.toISOString() });
        total += count;
      }
    }

    return { total, items };
  }

  // ! Upload file lên Cloudinary + tạo Attachment record (chưa gắn message)
  static async upload_attachment(
    ownerId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
  ) {
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
            return reject(error || new Error("Upload Cloudinary thất bại!"));
          }
          resolve(uploaded);
        }
      );
      stream.end(file.buffer);
    });

    const attachment = await prisma.attachment.create({
      data: {
        owner: ownerId,
        name: file.originalname,
        mime: file.mimetype,
        size: file.size,
        url: result.secure_url,
      },
    });

    return {
      attachmentId: attachment.id,
      originalName: attachment.name,
      fileName: attachment.id,
      mimeType: attachment.mime,
      sizeBytes: attachment.size,
      url: attachment.url,
    };
  }

  // ! Tạo hoặc lấy lại conversation giữa 2 người
  static async upsert_conversation(userId: string, peerId: string, courseId?: string) {
    if (peerId === userId) {
      throw new Error("Không thể tạo cuộc trò chuyện với chính mình!");
    }

    const peer = await prisma.user.findUnique({
      where: { id: peerId },
      select: { id: true, name: true, avatar: true, role: true },
    });
    if (!peer) {
      throw new Error("Người dùng không tồn tại!");
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        throw new Error("Khóa học không tồn tại!");
      }
    }

    const [user1, user2] = [userId, peerId].sort() as [string, string];
    
    const courseSelect = {
      id: true, code: true, name: true, slug: true, thumb: true, price: true,
    } as const;

    let chat = await prisma.chat.findFirst({
      where: { user1, user2, core: courseId ?? null },
      include: { course: { select: courseSelect } },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { user1, user2, core: courseId ?? null, type: (courseId ? "COURSE" : "DIRECT") as any },
        include: { course: { select: courseSelect } },
      });
    }

    const chatData = chat as any;

    return {
      id: chatData.id,
      type: chatData.type,
      course: chatData.course
        ? {
            id: chatData.course.id,
            code: chatData.course.code,
            name: chatData.course.name,
            slug: chatData.course.slug,
            grade: null,
            thumbnail: chatData.course.thumb,
            price: chatData.course.price ? Number(chatData.course.price) : null,
          }
        : null,
      peer: this.map_user(peer),
      lastMessageAt: null,
      lastMessagePreview: null,
      unreadCount: 0,
    };
  }
}