
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { connectToDatabase, closeConnection } from './db/mongodb';
import { connectToRedis, getRedisClient, closeRedisConnection } from './db/redis';
import config from './config';
import routes from './routes';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes 
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Setup Socket.IO with Redis adapter
const setupSocketIO = async () => {
  try {
    const io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Connect to Redis for Socket.IO adapter
    if (config.redisUrl) {
      const { pubClient, subClient } = await getRedisClient();
      io.adapter(createAdapter(pubClient, subClient));
    }

    // Listen for socket connections
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  } catch (error) {
    console.error('Failed to setup Socket.IO:', error);
    throw error;
  }
};

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Connect to Redis
    await connectToRedis();
    
    // Setup Socket.IO
    const io = await setupSocketIO();
    
    // Start the server
    const PORT = config.port;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      
      // Close the HTTP server
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connections
        await closeConnection();
        await closeRedisConnection();
        
        process.exit(0);
      });
      
      // Force exit after timeout if connections are stuck
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// For testing
export { app, server };
