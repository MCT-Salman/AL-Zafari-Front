import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://192.168.3.11:3000";

let socket;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  const raw = token || localStorage.getItem("accessToken");
  const accessToken = typeof raw === "string" ? raw.replace(/^Bearer\s+/i, "") : raw;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken,
      authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};
