import type { Server, Socket } from "socket.io";

const online = new Map<string, Set<string>>();
const offline = new Map<string, string>();

// Đánh dấu online
export function markOnline(
  userId: string,
  socketId: string
) {
  // Lưu user vào set
  if (!online.has(userId)) {
    online.set(
      userId,
      new Set()
    );
  }

  online.get(userId)!.add(socketId);
}

// Đánh dấu offline
export function markOffline(
  userId: string,
  socketId: string
): boolean {
  const set = online.get(userId);

  if (!set) {
    return true;
  }

  set.delete(socketId);

  if (set.size === 0) {
    online.delete(userId);
    offline.set(
      userId,
      new Date().toISOString()
    );
    return true;
  }

  return false;
}

// Kiểm tra trạng thái không hoạt động
export function checkOffline(userId: string) {
  return offline.get(userId) ?? null;
}

// Kiểm tra trạng thái hoạt động
export function checkOnline(userIds: string[]) {
  return userIds.filter((id) => {
    return online.has(id);
  });
}

export function PresenceHandlers(
  io: Server,
  socket: Socket
) {
  // Lấy user đang đăng nhập
  const userId = socket.data.user.id;

  markOnline(
    userId,
    socket.id
  );

  // Phát tín hiệu cập nhật
  io.emit(
    "presence:update",
    {
      userId,
      online: true,
    }
  );

  // Lắng nghe trạng thái hoạt động
  socket.on(
    "presence:ping",
    () => {
      markOnline(
        userId,
        socket.id
      );
    }
  );

  // Lắng nghe trạng thái mất kết nối
  socket.on(
    "disconnect",
    () => {
      const fullyOffline = markOffline(
        userId,
        socket.id
      );

      if (fullyOffline) {
        io.emit(
          "presence:update",
          {
            userId,
            online: false,
            offlineAt: checkOffline(userId) ?? undefined,
          }
        );
      }
    }
  );
}