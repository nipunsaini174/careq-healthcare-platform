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

      let rolesToTarget: string[] = [];
      if (target === 'ALL') {
        rolesToTarget = ['patient', 'PATIENT', 'doctor', 'DOCTOR', 'receptionist', 'RECEPTIONIST'];
      } else {
        rolesToTarget = [target.toUpperCase(), target.toLowerCase()];
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

  getUserNotifications = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notifications = await prisma.notifications.findMany({
        where: { user_id: Number(user.userId) },
        orderBy: { created_at: 'desc' },
      });

      // Prisma returns BigInts which fail JSON serialization natively.
      const formatted = notifications.map(n => ({
        ...n,
        notification_id: Number(n.notification_id),
        hospital_id: Number(n.hospital_id),
        user_id: Number(n.user_id)
      }));

      res.status(200).json(formatted);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user || !user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await prisma.notifications.updateMany({
        where: { 
          notification_id: Number(id as string),
          user_id: Number(user.userId) 
        },
        data: { is_read: true }
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error marking notification read:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  markAllRead = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await prisma.notifications.updateMany({
        where: { user_id: Number(user.userId), is_read: false },
        data: { is_read: true }
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications read:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
}

export const notificationController = new NotificationController();
