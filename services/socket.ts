import { io, Socket } from "socket.io-client";
import Config from "../constants/Config";

let socket: Socket | null = null;
let socketToken: string | null = null;

export const connectSocket = (token?: string | null): Socket => {
  if (socket && socketToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token || null;

  socket = io(Config.API_URL, {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("[Socket Connected] ID:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket Disconnected] Reason:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

export const joinFolderRoom = (folderId: string, token?: string | null) => {
  const activeSocket = connectSocket(token);
  if (activeSocket) {
    activeSocket.emit("join_folder", folderId);
    console.log(`[Socket] Requested join room: folder_${folderId}`);
  }
};

export const leaveFolderRoom = (folderId: string) => {
  if (socket) {
    socket.emit("leave_folder", folderId);
    console.log(`[Socket] Requested leave room: folder_${folderId}`);
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
