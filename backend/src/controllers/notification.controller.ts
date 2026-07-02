import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { broadcastGlobalNotification } from '../sockets/index.js';

export class NotificationController {
  sendGlobalBroadcast = async (req: Request, res: Response) => {
    try {
      const { title, message, type, target = 'PATIENT' } = req.body;

      if (!title || !message || !type) {
        return res.status(400).json({ error: 'Title, message, and type are required' });
      }

      // We need a hospital ID to associate notifications. 
      // Fallback to the first hospital.
      const hospital = await prisma.hospitals.findFirst();
      if (!hospital) {
        return res.status(400).json({ error: 'No hospital found in system' });
      }

      // Determine which roles to target
      let rolesToTarget: string[] = [];
      if (target === 'ALL') {
        rolesToTarget = ['PATIENT', 'DOCTOR', 'RECEPTIONIST'];
      } else {
        rolesToTarget = [target];
      }

      // Fetch all target user IDs to bulk insert notifications
      const users = await prisma.users.findMany({
        where: { role: { in: rolesToTarget } },
        select: { user_id: true }
      });

      if (users.length > 0) {
        const notificationsData = users.map((u) => ({
          hospital_id: hospital.hospital_id,
          user_id: u.user_id,
          category: 'BROADCAST',
          title,
          message,
          severity: type.toLowerCase(), // info, warning, emergency
          is_read: false,
        }));

        await prisma.notifications.createMany({
          data: notificationsData,
        });
      }

      // Trigger the real-time Socket.IO broadcast
      const broadcastData = {
        title,
        message,
        type,
        timestamp: new Date().toISOString()
      };
      
      broadcastGlobalNotification(target, broadcastData);

      res.status(201).json({ success: true, message: 'Broadcast sent successfully', usersReached: users.length });
    } catch (error: any) {
      console.error('Error in sendGlobalBroadcast:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
}

export const notificationController = new NotificationController();
