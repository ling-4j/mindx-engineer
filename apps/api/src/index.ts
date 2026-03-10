// IMPORTANT: Instrumentation must be imported before any other modules
import './instrumentation.js';

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authRouter, isAuthenticated } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { TicketService } from './tickets/domain/services/TicketService.js';
import { OdooTicketProvider } from './tickets/adapters/providers/OdooTicketProvider.js';
import { Ticket } from './tickets/domain/models/Ticket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Ticket Service
// Local repo removed as per user request
const ticketRepo = {
  save: async () => { },
  findById: async () => null,
  findAll: async () => [],
  update: async () => { }
} as any;
let odooProvider: OdooTicketProvider | undefined;

if (process.env.USE_ODOO === 'true') {
  odooProvider = new OdooTicketProvider({
    url: process.env.ODOO_URL!,
    db: process.env.ODOO_DB!,
    username: process.env.ODOO_USERNAME!,
    apiKey: process.env.ODOO_API_KEY!
  });
}

const ticketService = new TicketService(ticketRepo, odooProvider);

const app = express();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

console.log('Session Middleware Initialized with:', {
  nodeEnv: NODE_ENV,
  secureCookie: NODE_ENV === 'production'
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(['/auth', '/api/auth'], authRouter);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from API',
    timestamp: new Date().toISOString(),
    user: req.session?.user ? { email: req.session.user.email } : null
  });
});

app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    name: 'MindX Engineer Week 1 API',
    version: '1.0.0',
    endpoints: ['/health', '/api/hello', '/api/info', '/api/auth/login', '/api/auth/me', '/api/secure-data'],
    documentation: 'See README.md for details',
  });
});

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

// alert test api
app.get('/api/test-alerts', (req: Request, res: Response) => {
  const type = req.query.type as string;
  const duration = parseInt(req.query.duration as string) || 3000;

  if (type === 'error') {
    console.error(`[${new Date().toISOString()}] Triggering test error for Alert testing`);
    throw new Error('Test Alert: Manual Trigger for High Error Rate');
  }

  if (type === 'latency') {
    console.log(`[${new Date().toISOString()}] Simulating latency: ${duration}ms`);
    setTimeout(() => {
      res.json({
        message: 'Latency test complete',
        duration,
        timestamp: new Date().toISOString()
      });
    }, duration);
    return;
  }

  res.json({
    message: 'Alert test endpoint ready',
    usage: {
      error: '/api/test-alerts?type=error',
      latency: '/api/test-alerts?type=latency&duration=3000'
    }
  });
});

// Tickets API
app.get('/api/tickets', async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string;
    let odooTickets: Ticket[] = [];

    if (process.env.USE_ODOO === 'true') {
      try {
        if (filter === 'unprocessed') {
          odooTickets = await ticketService.fetchUnprocessed();
        } else if (filter === 'new') {
          odooTickets = await ticketService.fetchExternalTickets();
        } else {
          odooTickets = await ticketService.fetchExternalTickets();
        }
      } catch (e: any) {
        console.error('Failed to fetch Odoo tickets:', e.message);
      }
    }

    res.json({
      odoo: odooTickets
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { title, description, priority, tags, source } = req.body;
    if (source === 'odoo') {
      const ticket = await ticketService.createExternalTicket({ title, description, priority, tags });
      return res.status(201).json(ticket);
    }
    const ticket = await ticketService.createTicket({ title, description, priority, tags });
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.getTicketDetails(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    await ticketService.updateTicketStatus(req.params.id, status);
    res.json({ message: 'Status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
  console.log(`[${timestamp}] Port: ${PORT}`);
  console.log(`[${timestamp}] Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`[${timestamp}] Redirect URI: ${process.env.OIDC_REDIRECT_URI}`);
});
