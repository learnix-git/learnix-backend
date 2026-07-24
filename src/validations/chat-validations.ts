import { z } from "zod";

const MESSAGE_LENGTH = 5000;
const FILE_SIZE = 10 * 1024 * 1024;
const EXTENSIONS = [
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

// Trường dữ liệu chung
const ContentField = z
  .string()
  .max(MESSAGE_LENGTH, `Tin nhắn tối đa ${MESSAGE_LENGTH} ký tự`);

const AttachmentField = z.string().min(1, "Thiếu attachmentId");

// Xác thực cuộc trò chuyện
export const ConversationSchema = z.object({
  conversationId: z.string().min(1, "Thiếu conversationId"),
});

export type ConversationData = z.infer<typeof ConversationSchema>;

// Xác thực phân trang
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

// Xác thực tin nhắn
export const MessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: ContentField.min(1, "Nội dung tin nhắn không được để trống"),
  }),
  z.object({
    type: z.literal("image"),
    attachmentId: AttachmentField,
    content: ContentField.optional(),
  }),
  z.object({
    type: z.literal("file"),
    attachmentId: AttachmentField,
    content: ContentField.optional(),
  }),
]);

export type MessageData = z.infer<typeof MessageSchema>;

// Xác thực danh sách tin nhắn
export const MessagesSchema = ConversationSchema.extend(PaginationSchema.shape);

export type MessagesData = z.infer<typeof MessagesSchema>;

// Xác thực socket
export const SocketSchema = ConversationSchema.and(MessageSchema);

export type SocketData = z.infer<typeof SocketSchema>;

// Xác thực đánh dấu đã đọc
export const MarkReadSchema = ConversationSchema.extend({
  messageId: z.string().min(1, "Thiếu messageId"),
});

export type MarkReadData = z.infer<typeof MarkReadSchema>;

// Xác thực trạng thái hoạt động
export const OnlineSchema = z.object({
  userIds: z
    .array(z.string().min(1, "userId không hợp lệ"))
    .min(1, "Danh sách userId rỗng")
    .max(200, "Tối đa 200 userId mỗi lần kiểm tra"),
});

export type OnlineData = z.infer<typeof OnlineSchema>;

// Xác thực tệp đính kèm
export const AttachmentSchema = z
  .object({
    originalname: z.string().min(1, "Thiếu tên file"),
    mimetype: z.string().min(1, "Thiếu mimetype"),
    size: z.number().max(FILE_SIZE, "File vượt quá 10MB"),
  })
  .refine(
    (file) => {
      const ext = file.originalname.split(".").pop()?.toLowerCase();
      return !!ext && EXTENSIONS.includes(ext);
    },
    { message: "Định dạng file không được hỗ trợ", path: ["originalname"] }
  );

export type AttachmentData = z.infer<typeof AttachmentSchema>;

// Xác thực tạo cuộc trò chuyện
export const UpsertSchema = z.object({
  peerId: z.string().min(1, "Thiếu peerId"),
});

export type UpsertData = z.infer<typeof UpsertSchema>;

// Xác thực trạng thái đang gõ
export const TypingSchema = ConversationSchema.extend({
  typing: z.boolean(),
});

export type TypingData = z.infer<typeof TypingSchema>;

export { MESSAGE_LENGTH, FILE_SIZE, EXTENSIONS };