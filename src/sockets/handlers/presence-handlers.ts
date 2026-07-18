import type { Server, Socket } from "socket.io";

const online = new Map<string, Set<string>>();
const lastSeen = new Map<string, string>();

export function markOnline(userId: string, socketId: string) {
  if (!online.has(userId)) online.set(userId, new Set());
  online.get(userId)!.add(socketId);
}

export function markOffline(userId: string, socketId: string): boolean {
  const set = online.get(userId);
  if (!set) return true;
  set.delete(socketId);
  if (set.size === 0) {
    online.delete(userId);
    lastSeen.set(userId, new Date().toISOString());
    return true;
  }
  return false;
}

export function getLastSeen(userId: string) {
  return lastSeen.get(userId) ?? null;
}

export function checkOnline(userIds: string[]) {
  return userIds.filter((id) => online.has(id));
}

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId = socket.data.user.id;
  markOnline(userId, socket.id);
  io.emit("presence:update", { userId, online: true });

  socket.on("presence:ping", () => markOnline(userId, socket.id));

  socket.on("disconnect", () => {
    const fullyOffline = markOffline(userId, socket.id);
    if (fullyOffline) {
      io.emit("presence:update", { userId, online: false, lastSeenAt: getLastSeen(userId) ?? undefined });
    }
  });
}