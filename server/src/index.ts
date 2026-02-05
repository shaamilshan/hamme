import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import profileRoutes from './routes/profile';
import authRoutes from './routes/auth';
import matchingRoutes from './routes/matching';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'https://hamme.vercel.app',
  process.env.CORS_ORIGIN || '',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
// Remove explicit OPTIONS handler - CORS middleware already handles preflight
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory with headers safe for canvas usage
// Only in non-serverless environments (skip on Vercel)
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
    setHeaders: (res) => {
      // Allow images to be fetched cross-origin (for canvas, etc.)
      res.setHeader('Access-Control-Allow-Origin', 'https://hamme.vercel.app');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
} else {
  console.log('Skipping static file serving in serverless environment - using Cloudinary');
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hamme API Server is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matching', matchingRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
