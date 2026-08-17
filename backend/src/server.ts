import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { initSocket } from './sockets/index.js';

// Polyfill for BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 5000;

const startServer = () => {
  try {
    const server = http.createServer(app);
    initSocket(server);

    server.listen(Number(PORT) || 5000, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
