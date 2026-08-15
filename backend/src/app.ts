import express, { type Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import receptionistRoutes from './routes/receptionist.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import queueRoutes from './routes/queue.routes.js';
import retentionRoutes from './routes/retention.routes.js';
import { hospitalAdminRouter, hospitalPublicRouter, hospitalStaffRouter } from './routes/hospital.routes.js';

const app: Application = express();

/**
 * Explicit CORS allow-list. Bare `cors()` returns the wildcard '*' for
 * non-credential requests, which usually works — but Windows + Next.js
 * dev sometimes serves the page from one origin (localhost:3000) while
 * fetch hits another (e.g. a LAN IP), and the preflight ends up
 * confused. Listing every dev origin we actually use makes the
 * Access-Control-Allow-Origin response predictable.
 *
 * Production deploys should narrow this to known frontend domains via
 * the CORS_ALLOWED_ORIGINS env var (comma-separated).
 */
const ENV_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const ALLOWED_ORIGINS = [...new Set([...ENV_ORIGINS, ...DEV_ORIGINS])];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Non-browser tools (curl, server-to-server) send no Origin header.
    // Allow those — auth is enforced by JWT middleware downstream.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Allow any LAN/localhost dev origin: accommodates testing on
    // another device (phone on the same Wi-Fi) without code changes.
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // cache preflight for 24h
};

app.use(cors(corsOptions));
// Pre-flight for every route — older Express versions need this to
// actually short-circuit OPTIONS, otherwise the request walks the
// router chain and times out on protected paths.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import appointmentRoutes from './routes/appointment.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/hospital', hospitalAdminRouter);
app.use('/api/hospital', hospitalStaffRouter);
app.use('/api/hospitals', hospitalPublicRouter);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/retention', retentionRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Express server is running!' });
});

export default app;
