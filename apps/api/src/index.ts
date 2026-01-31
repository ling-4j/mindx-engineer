import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authRouter, isAuthenticated } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: NODE_ENV === 'production', // Set true if https
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Authentication Routes
// Support both paths for backward compatibility in dev and Ingress routing in prod
app.use(['/auth', '/api/auth'], authRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// Hello endpoint
app.get('/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from API',
    timestamp: new Date().toISOString(),
    user: req.session?.user ? { email: req.session.user.email} : null
  });
});

// API info endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    name: 'MindX Engineer Week 1 API',
    version: '1.0.0',
    endpoints: ['/health', '/hello', '/api/info', '/auth/login', '/auth/me', '/api/secure-data'],
    documentation: 'See README.md for details',
  });
});

// Protected API endpoint
app.get('/api/secure-data', isAuthenticated, (req: Request, res: Response) => {
  res.json({
    message: 'This is sensitive data only for logged-in users!',
    user: req.session?.user ? {
      id: req.session.user.id || req.session.user.sub,
      email: req.session.user.email,
    } : null,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: `Endpoint ${req.method} ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, err.message);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp,
  });
});

// Start server
app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] API server started`);
  console.log(`[${timestamp}] Environment: ${NODE_ENV}`);
  console.log(`[${timestamp}] Listening on port ${PORT}`);
  console.log(`[${timestamp}] Health check: http://localhost:${PORT}/health`);
  console.log(`[${timestamp}] Auth Login: http://localhost:${PORT}/auth/login`);
});
