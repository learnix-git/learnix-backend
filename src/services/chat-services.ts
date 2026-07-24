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

const FOLDER = 'Learnix/Chat';

type Payload =
  | { type: 'text'; content: string }
  | { type: 'image' | 'file'; attachmentId: string; content?: string };

export class ChatService {
  // Hàm kiểm tra quyền truy cập
  static async check_role(
    conversationId: string,
    userId: string
  ) {
    // Lấy ID cuộc trò chuyện
    const chat = await prisma.chat.findUnique({
      where: {
        id: conversationId,
      },
    });

    // Kiểm tra cuộc trò chuyện có tồn tại không
    if (!chat) {
      throw new Error("Cuộc trò chuyện không tồn tại!");
    }

    // Kiểm tra quyền truy cập của hai người dùng
    if (
      chat.first !== userId &&
      chat.second !== userId
    ) {
      throw new Error("Bạn không có quyền truy cập cuộc trò chuyện này!");
    }

    return chat;
  }

  // Hàm lấy bản xem trước trong danh sách tin nhắn
  private static get_preview(
    kind: string,
    content: string | null
  ) {
    // Nếu là chữ hoặc hệ thống thì hiển thị nội dung
    if (
      kind === "TEXT" ||
      kind === "SYSTEM"
    ) {
      return content || "";
    }

    // Nếu là hình ảnh thì hiển thị hình ảnh
    if (kind === "IMAGE") {
      return "Hình ảnh";
    }

    // Nếu không thuộc các loại trên thì hiển thị tệp đính kèm
    return "Tệp đính kèm";
  }

  // Hàm lấy danh sách cuộc trò chuyện
  static async get_conversations(userId: string) {
    // Lấy tất cả cuộc trò chuyện
    const chats = await prisma.chat.findMany({
      // Điều kiện người dùng phải là một trong hai người của cuộc trò chuyện
      where: {
        OR: [
          {
            first: userId,
          },
          {
            second: userId,
          },
        ],
      },
      include: {
        // Lấy thông tin người thứ nhất
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        // Lấy thông tin người thứ hai
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        // Lấy tin nhắn mới nhất để xem trước
        messages: {
          orderBy: {
            created: "desc",
          },
          take: 1,
        },
      },
      // Sắp xếp danh sách cuộc trò chuyện theo thời gian giảm dần
      orderBy: {
        updated: "desc",
      },
    });

    return Promise.all(
      chats.map(async (chat) => {
        const peer = chat.first === userId ? chat.user2 : chat.user1;
        const readAt = chat.first === userId ? chat.read1 : chat.read2;

        // Đếm số tin nhắn chưa đọc
        const unreadCount = await prisma.message.count({
          // Điều kiện chỉ đếm số tin nhắn trong một cuộc trò chuyện
          where: {
            room: chat.id,
            // Không tính do người dùng gửi
            sender: {
              not: userId,
            },
            ...(readAt
              ? {
                  created: {
                    gt: readAt,
                  },
                }
              : {}),
          },
        });

        const last = chat.messages[0] ?? null;

        return {
          id: chat.id,
          peer,
          lastMessageAt: last?.created ?? null,
          lastMessagePreview: last ? this.get_preview(last.kind, last.content) : null,
          unreadCount,
        };
      })
    );
  }

  // Hàm lấy danh sách tin nhắn trong một cuộc trò chuyện
  static async get_messages(
    conversationId: string,
    userId: string,
    page: number,
    size: number
  ) {
    // Kiểm tra quyền truy cập
    await this.check_role(conversationId, userId);

    // Đếm và lấy tin nhắn song song
    const [total, rows] = await Promise.all([
      // Đếm số lượng tin nhắn
      prisma.message.count({
        where: {
          room: conversationId,
        },
      }),
      // Lấy danh sách tin nhắn
      prisma.message.findMany({
        where: {
          room: conversationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          attachment: true,
        },
        orderBy: {
          created: "desc",
        },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      items: rows.reverse(),
      total,
    };
  }

  // Hàm gửi tin nhắn
  static async post_message(
    conversationId: string,
    senderId: string,
    payload: Payload
  ) {
    // Kiểm tra quyền truy cập và lấy thông tin người dùng
    const [, sender] = await Promise.all([
      // Kiểm tra quyền truy cập
      this.check_role(conversationId, senderId),
      // Lấy thông tin người dùng
      prisma.user.findUnique({
        where: {
          id: senderId,
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
        },
      }),
    ]);

    if (!sender) {
      throw new Error("Người dùng không tồn tại!");
    }

    // Khởi tạo tệp đính kèm
    let record: {
      id: string;
      name: string;
      mime: string;
      size: number;
      url: string;
    } | null = null;

    // Nếu không phải văn bản thì kiểm tra tệp đính kèm
    // - Kiểm tra sự tồn tại
    // - Kiểm tra quyền truy cập
    // - Kiểm tra đã được sử dụng
    if (payload.type !== "text") {
      // Lấy thông tin tệp
      const attachment = await prisma.attachment.findUnique({
        where: {
          id: payload.attachmentId,
        },
      });

      if (!attachment) {
        throw new Error("Tệp đính kèm không tồn tại!");
      }

      if (attachment.owner !== senderId) {
        throw new Error("Bạn không có quyền dùng tệp đính kèm này!");
      }

      const used = await prisma.message.findUnique({
        where: {
          attach: attachment.id,
        },
      });

      if (used) {
        throw new Error("Tệp đính kèm đã được sử dụng!");
      }

      record = attachment;
    }

    // Tạo tin nhắn
    const message = await prisma.message.create({
      data: {
        room: conversationId,
        sender: senderId,
        kind: payload.type.toUpperCase() as any,
        content: payload.type === "text" ? payload.content : (payload.content ?? null),
        attach: record?.id ?? null,
      },
    });

    // Cập nhật cuộc trò chuyện
    prisma.chat
      .update({
        where: {
          id: conversationId,
        },
        data: {
          updated: new Date(),
        },
      })
      .catch((err) => {
        console.error(err);
      });

    return {
      ...message,
      user: sender,
      attachment: record,
    };
  }

  // Hàm đánh dấu đã đọc
  static async mark_as_read(
    conversationId: string,
    readerId: string,
    messageId: string
  ) {
    // Kiểm tra quyền truy cập
    const chat = await this.check_role(conversationId, readerId);

    // Tìm kiếm tin nhắn
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    // Kiểm tra tin nhắn hợp lệ
    if (
      !message ||
      message.room !== conversationId
    ) {
      throw new Error("Tin nhắn không tồn tại trong cuộc trò chuyện này!");
    }

    // Xác định người đọc và cập nhập trạng thái
    const field = chat.first === readerId ? "read1" : "read2";

    await prisma.chat.update({
      where: {
        id: conversationId,
      },
      data: {
        [field]: message.created,
      },
    });
  }

  // Hàm đếm tin nhắn chưa đọc
  static async count_unread(userId: string) {
    // Lấy tất cả cuộc trò chuyện
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            first: userId,
          },
          {
            second: userId,
          },
        ],
      },
    });

    const results = await Promise.all(
      chats.map(async (chat) => {
        // Xác định thời điểm đọc
        const readAt = chat.first === userId ? chat.read1 : chat.read2;

        const [count, last] = await Promise.all([
          // Đếm tin nhắn chưa đọc
          prisma.message.count({
            where: {
              room: chat.id,
              sender: {
                not: userId,
              },
              ...(readAt
                ? {
                    created: {
                      gt: readAt,
                    },
                  }
                : {}),
            },
          }),
          // Lấy tin nhắn cuối cùng
          prisma.message.findFirst({
            where: {
              room: chat.id,
            },
            orderBy: {
              created: "desc",
            },
          }),
        ]);

        return {
          chat,
          count,
          last,
        };
      })
    );

    // Tổng tin nhắn chưa đọc
    let total = 0;
    // Danh sách các cuộc trò chuyện chưa đọc
    const items: {
      conversationId: string;
      count: number;
      latestAt: Date;
    }[] = [];

    for (const res of results) {
      if (
        res.count > 0 &&
        res.last
      ) {
        items.push({
          conversationId: res.chat.id,
          count: res.count,
          latestAt: res.last.created,
        });
        total += res.count;
      }
    }

    return {
      total,
      items,
    };
  }

  // Hàm đăng tải tệp đính kèm
  static async upload_attachment(
    ownerId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ) {
    // Kiểm tra có phải ảnh không
    const isImage = file.mimetype.startsWith("image/");

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      // Đăng tải lên Cloudinary
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

    const attachment = await prisma.attachment.create({
      data: {
        owner: ownerId,
        name: file.originalname,
        mime: file.mimetype,
        size: file.size,
        url: result.secure_url,
      },
    });

    return attachment;
  }

  // Hàm tạo cuộc trò chuyện
  static async upsert_conversation(
    userId: string,
    peerId: string
  ) {
    // Không cho trò chuyện với chính mình
    if (peerId === userId) {
      throw new Error("Không thể tạo cuộc trò chuyện với chính mình!");
    }

    // Kiểm tra thông tin đối phương
    const peer = await prisma.user.findUnique({
      where: {
        id: peerId,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    if (!peer) {
      throw new Error("Người dùng không tồn tại!");
    }

    // Sắp xếp ID để không trùng cuộc trò chuyện
    const [first, second] = [userId, peerId].sort() as [string, string];

    // Tìm cuộc trò chuyện
    let chat = await prisma.chat.findFirst({
      where: {
        first,
        second,
      },
    });

    // Nếu không có thì tạo mới
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          first,
          second,
        },
      });
    }

    return {
      ...chat,
      peer,
      lastMessageAt: null,
      lastMessagePreview: null,
      unreadCount: 0,
    };
  }
}