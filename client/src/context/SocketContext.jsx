import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const joinRoom = useCallback((userId) => {
    socket?.emit('join-room', userId);
  }, [socket]);

  const sendLocationUpdate = useCallback((data) => {
    socket?.emit('location-update', data);
  }, [socket]);

  const sendPanicAlert = useCallback((data) => {
    socket?.emit('panic-alert', data);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, joinRoom, sendLocationUpdate, sendPanicAlert }}>
      {children}
    </SocketContext.Provider>
  );
};
