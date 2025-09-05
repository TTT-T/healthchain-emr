import Application from './app';

/**
 * EMR Backend Server
 * 
 * 3 Core Functions:
 * 1. 🏥 EMR Web Application (แพทย์, พยาบาล, ผู้ป่วย, ตัวแทนประกัน)
 * 2. 🤖 AI Risk Assessment System (คาดการณ์ความเสี่ยง)
 * 3. 📝 Consent Engine (Smart Contract-like Logic)
 */

const app = new Application();

// Start server
app.start().catch((error) => {
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
