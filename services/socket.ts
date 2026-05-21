import { io, Socket } from "socket.io-client";
import Config from "../constants/Config";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (socket) return socket;

  socket = io(Config.API_URL, {
    transports: ["websocket"],
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
  }
};

export const joinFolderRoom = (folderId: string) => {
  const activeSocket = connectSocket();
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
