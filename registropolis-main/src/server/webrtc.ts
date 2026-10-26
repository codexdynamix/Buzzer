
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient } from './db/redis';

type SocketUser = {
  userId: string;
  socketId: string;
};

export const setupWebRTC = (io: SocketIOServer) => {
  // Store connected users with their socket IDs
  const connectedUsers: SocketUser[] = [];
  
  // Socket.IO connection event
  io.on('connection', (socket) => {
    console.log('New WebRTC connection:', socket.id);
    
    // Register user
    socket.on('register', (userId: string) => {
      console.log(`User registered: ${userId}`);
      
      // Remove any existing sockets for this user
      const existingIndex = connectedUsers.findIndex(user => user.userId === userId);
      if (existingIndex !== -1) {
        connectedUsers.splice(existingIndex, 1);
      }
      
      // Add new socket
      connectedUsers.push({ userId, socketId: socket.id });
      
      // Acknowledge registration
      socket.emit('registered', { success: true });
    });
    
    // Signaling handlers
    
    // Call request
    socket.on('call-user', ({ to, offer, from }) => {
      const targetUser = connectedUsers.find(user => user.userId === to);
      
      if (targetUser) {
        io.to(targetUser.socketId).emit('call-incoming', {
          from,
          offer
        });
      }
    });
    
    // Call answer
    socket.on('call-answer', ({ to, answer }) => {
      const targetUser = connectedUsers.find(user => user.userId === to);
      
      if (targetUser) {
        io.to(targetUser.socketId).emit('call-accepted', {
          answer
        });
      }
    });
    
    // ICE candidates
    socket.on('ice-candidate', ({ to, candidate }) => {
      const targetUser = connectedUsers.find(user => user.userId === to);
      
      if (targetUser) {
        io.to(targetUser.socketId).emit('ice-candidate', {
          candidate
        });
      }
    });
    
    // End call
    socket.on('end-call', ({ to }) => {
      const targetUser = connectedUsers.find(user => user.userId === to);
      
      if (targetUser) {
        io.to(targetUser.socketId).emit('call-ended');
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('WebRTC connection closed:', socket.id);
      
      const index = connectedUsers.findIndex(user => user.socketId === socket.id);
      if (index !== -1) {
        connectedUsers.splice(index, 1);
      }
    });
  });
  
  return io;
};
