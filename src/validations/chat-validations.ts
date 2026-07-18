import { z } from "zod";

const MAX_MESSAGE_LENGTH = 5000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "zip",
];

// ! Payload gửi tin nhắn
export const MessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z
      .string()
      .min(1, "Nội dung tin nhắn không được để trống")
      .max(MAX_MESSAGE_LENGTH, `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`),
  }),
  z.object({
    type: z.literal("image"),
    attachmentId: z.string().min(1, "Thiếu attachmentId"),
    content: z
      .string()
      .max(MAX_MESSAGE_LENGTH, `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`)
      .optional(),
  }),
  z.object({
    type: z.literal("file"),
    attachmentId: z.string().min(1, "Thiếu attachmentId"),
    content: z
      .string()
      .max(MAX_MESSAGE_LENGTH, `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự`)
      .optional(),
  }),
]);

export type MessageData = z.infer<typeof MessageSchema>;

// ! Payload socket
export const SocketSchema = z.intersection(
  z.object({
    conversationId: z.string().min(1, "Thiếu conversationId"),
  }),
  MessageSchema
);

export type SocketData = z.infer<typeof SocketSchema>;

// ! Đánh dấu đã đọc
export const MarkReadSchema = z.object({
  conversationId: z.string().min(1, "Thiếu conversationId"),
  messageId: z.string().min(1, "Thiếu messageId"),
});

export type MarkReadData = z.infer<typeof MarkReadSchema>;

// ! Join/leave conversation + typing:start/stop
export const ConversationSchema = z.object({
  conversationId: z.string().min(1, "Thiếu conversationId"),
});

export type ConversationData = z.infer<typeof ConversationSchema>;

// ! Query phân trang tin nhắn
export const PaginationSchema = z.object({
  page: z.coerce.number().int("Page không hợp lệ").min(1, "Page tối thiểu là 1").default(1),
  limit: z.coerce
    .number()
    .int("Limit không hợp lệ")
    .min(1, "Limit tối thiểu là 1")
    .max(50, "Limit tối đa là 50")
    .default(30),
});

export type PaginationData = z.infer<typeof PaginationSchema>;

// ! Kiểm tra danh sách tin nhắn
export const MessagesSchema = PaginationSchema.extend({
  conversationId: z.string().min(1, "Thiếu conversationId"),
});

export type MessagesData = z.infer<typeof MessagesSchema>;

// ! Lọc danh sách conversation theo loại
export const FilterSchema = z.object({
  type: z.enum(["direct", "course"]).optional(),
});

export type FilterData = z.infer<typeof FilterSchema>;

// ! Check online hàng loạt
export const OnlineSchema = z.object({
  userIds: z
    .array(z.string().min(1, "userId không hợp lệ"))
    .min(1, "Danh sách userId rỗng")
    .max(200, "Tối đa 200 userId mỗi lần kiểm tra"),
});

export type OnlineData = z.infer<typeof OnlineSchema>;

// ! Metadata file upload 
export const AttachmentSchema = z
  .object({
    originalname: z.string().min(1, "Thiếu tên file"),
    mimetype: z.string().min(1, "Thiếu mimetype"),
    size: z.number().max(MAX_FILE_SIZE, "File vượt quá 10MB"),
  })
  .refine(
    (file) => {
      const ext = file.originalname.split(".").pop()?.toLowerCase();
      return !!ext && ALLOWED_EXT.includes(ext);
    },
    { message: "Định dạng file không được hỗ trợ", path: ["originalname"] }
  );

export type AttachmentData = z.infer<typeof AttachmentSchema>;

// ! Kiểm tra tin nhắn khi đăng lên
export const UpsertSchema = z.object({
  peerId: z.string().min(1, "Thiếu peerId"),
  courseId: z.string().min(1).optional(),
});

export type UpsertData = z.infer<typeof UpsertSchema>;

// ! Kiểm tra trạng thái đang gõ
export const TypingSchema = z.object({
  conversationId: z.string().min(1, "Thiếu conversationId"),
  typing: z.boolean(),
});

export type TypingData = z.infer<typeof TypingSchema>;

export { MAX_MESSAGE_LENGTH, MAX_FILE_SIZE, ALLOWED_EXT };