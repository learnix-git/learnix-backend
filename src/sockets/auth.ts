import type { Socket } from "socket.io";
import { verify } from "../utils/jwt";

export function socketAuth(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("invalid token"));
    const decoded = verify(token) as { id: string; role: string };
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("invalid token"));
  }
}