import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: Server;

export const initSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust to specific frontend domains in production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow patients to join the broadcast room
    socket.on('join_patient_room', () => {
      socket.join('patients_room');
      console.log(`Socket ${socket.id} joined patients_room`);
    });

    // Allow doctors to join the doctor room
    socket.on('join_doctor_room', () => {
      socket.join('doctors_room');
      console.log(`Socket ${socket.id} joined doctors_room`);
    });

    // Allow receptionists to join the receptionist room
    socket.on('join_receptionist_room', () => {
      socket.join('receptionists_room');
      console.log(`Socket ${socket.id} joined receptionists_room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const broadcastGlobalNotification = (target: string, data: { title: string; message: string; type: string; timestamp: string }) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot broadcast');
    return;
  }
  
  if (target === 'PATIENT' || target === 'ALL') {
    io.to('patients_room').emit('broadcast_notification', data);
  }
  if (target === 'DOCTOR' || target === 'ALL') {
    io.to('doctors_room').emit('broadcast_notification', data);
  }
  if (target === 'RECEPTIONIST' || target === 'ALL') {
    io.to('receptionists_room').emit('broadcast_notification', data);
  }
};
