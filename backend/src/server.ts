import Application from './app';
import WebSocketService from './services/websocketService';

/**
 * EMR Backend Server
 * 
 * 3 Core Functions:
 * 1. 🏥 EMR Web Application (แพทย์, พยาบาล, ผู้ป่วย, ตัวแทนประกัน)
 * 2. 🤖 AI Risk Assessment System (คาดการณ์ความเสี่ยง)
 * 3. 📝 Consent Engine (Smart Contract-like Logic)
 */

const app = new Application();
let webSocketService: WebSocketService;

// Start server
app.start().then((httpServer) => {
  // Initialize WebSocket service
  webSocketService = new WebSocketService(httpServer as any);
  console.log('🔌 WebSocket service initialized');
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  app.shutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  app.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  app.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  app.shutdown();
});
