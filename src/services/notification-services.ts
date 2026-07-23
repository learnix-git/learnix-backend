import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { getIO } from '../sockets/init';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export interface PushNotificationInput {
  ownerId: string;
  type: string;
  title: string;
  content: string;
  sourceId?: string | null;
  sourceAlias?: string | null;
  /** groupKey dùng chung cho các thông báo cùng nhóm, vd `post_bid:${postId}` */
  groupKey?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  /** Deep-link id tin nhắn, chỉ dùng cho type message_new */
  messageId?: string | null;
}

export class NotificationService {
  // ! Tạo 1 notification cho 1 user + emit realtime qua socket room `user:{id}`
  // Các service khác (booking, order, bid, ...) gọi hàm này khi có sự kiện cần báo user.
  static async push(input: PushNotificationInput) {
    const noti = await prisma.notification.create({
      data: {
        owner: input.ownerId,
        type: input.type,
        title: input.title,
        content: input.content,
        sourceId: input.sourceId ?? null,
        alias: input.sourceAlias ?? null,
        groupKey: input.groupKey ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
      },
    });

    // Payload khớp `InvalidatePayload` bên FE (lib/notifications/invalidate-bus.ts)
    const payload = {
      id: noti.id,
      type: noti.type,
      sourceId: noti.sourceId,
      sourceAlias: noti.alias,
      title: noti.title,
      content: noti.content,
      createdAt: noti.created.toISOString(),
      targetId: noti.id,
      userId: noti.owner,
      ...(input.messageId ? { messageId: input.messageId } : {}),
    };

    try {
      getIO().to(`user:${input.ownerId}`).emit('notification:new', payload);
    } catch (err) {
      console.error('[notification] emit socket thất bại:', err);
    }

    return noti;
  }

  // ! Map 1 row DB (non-group) -> NotificationItem cho FE
  private static map_single(n: {
    id: string; type: string; sourceId: string | null; alias: string | null;
    title: string; content: string; read: boolean; created: Date; actorName: string | null;
  }) {
    return {
      groupKey: null,
      type: n.type,
      sourceId: n.sourceId,
      sourceAlias: n.alias,
      title: n.title,
      content: n.content,
      summary: n.content,
      count: 1,
      unreadInGroup: n.read ? 0 : 1,
      isRead: n.read,
      latestCreators: n.actorName ? [n.actorName] : [],
      latestTargetId: n.id,
      latestAt: n.created.toISOString(),
    };
  }

  // ! Danh sách thông báo — gộp nhóm theo groupKey (hiện chỉ post_bid dùng), phân trang
  // Lưu ý: merge + sort + phân trang đang làm ở tầng application (không phải SQL) vì
  // group-by-latest-row không paginate thẳng bằng Prisma được. Ổn với volume vừa phải;
  // nếu số lượng thông báo/user tăng nhiều, nên tách bảng "group cache" riêng.
  static async list(userId: string, page: number, limit: number) {
    const [groupRows, singles, unreadCount] = await Promise.all([
      prisma.notification.groupBy({
        by: ['groupKey'],
        where: { owner: userId, groupKey: { not: null } },
      }),
      prisma.notification.findMany({ where: { owner: userId, groupKey: null } }),
      prisma.notification.count({ where: { owner: userId, read: false } }),
    ]);

    const groupItems = await Promise.all(
      groupRows.map(async (g) => {
        const key = g.groupKey as string;
        const [latest, count, unread, actors] = await Promise.all([
          prisma.notification.findFirst({ where: { owner: userId, groupKey: key }, orderBy: { created: 'desc' } }),
          prisma.notification.count({ where: { owner: userId, groupKey: key } }),
          prisma.notification.count({ where: { owner: userId, groupKey: key, read: false } }),
          prisma.notification.findMany({
            where: { owner: userId, groupKey: key, actorName: { not: null } },
            orderBy: { created: 'desc' },
            take: 3,
            select: { actorName: true },
            distinct: ['actorName'],
          }),
        ]);
        if (!latest) return null;
        return {
          groupKey: key,
          type: latest.type,
          sourceId: latest.sourceId,
          sourceAlias: latest.alias,
          title: latest.title,
          content: latest.content,
          summary: latest.content,
          count,
          unreadInGroup: unread,
          isRead: unread === 0,
          latestCreators: actors.map((a) => a.actorName!).filter(Boolean),
          latestTargetId: latest.id,
          latestAt: latest.created.toISOString(),
        };
      }),
    );

    const merged = [
      ...groupItems.filter((g): g is NonNullable<typeof g> => !!g),
      ...singles.map((n) => this.map_single(n)),
    ].sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));

    const total = merged.length;
    const items = merged.slice((page - 1) * limit, page * limit);

    return { items, total, unreadCount };
  }

  // ! Đánh dấu 1 notification (non-group) đã đọc — id = target id (chính Notification.id)
  static async mark_read(userId: string, id: string) {
    const noti = await prisma.notification.findUnique({ where: { id } });
    if (!noti || noti.owner !== userId) {
      throw new Error("Thông báo không tồn tại!");
    }
    if (noti.read) return 0;

    await prisma.notification.update({ where: { id }, data: { read: true, opened: new Date() } });
    return 1;
  }

  // ! Đánh dấu cả nhóm (groupKey) đã đọc
  static async mark_read_group(userId: string, groupKey: string) {
    const result = await prisma.notification.updateMany({
      where: { owner: userId, groupKey, read: false },
      data: { read: true, opened: new Date() },
    });
    return result.count;
  }

  // ! Đánh dấu tất cả đã đọc
  static async mark_read_all(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { owner: userId, read: false },
      data: { read: true, opened: new Date() },
    });
    return result.count;
  }
}