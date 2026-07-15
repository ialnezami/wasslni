import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

function buildSocketUrl(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base ? base.replace('/api/v1', '') : '';
}

export function getChatSocket(): Socket {
  if (!socket || socket.disconnected) {
    const token = useAuthStore.getState().accessToken;
    socket = io(`${buildSocketUrl()}/chat`, {
      auth: { token: token ?? '' },
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function updateSocketAuth(token: string) {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
}
