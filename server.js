import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbConnection } from "./src/database/dbConnection.js";
import { errorMiddleware } from './src/middleware/error.js';
import mobileUserRoutes from './src/mobileApi/mobileRoutes/mobileUserRoute.js';
import webUserRoutes from './src/webApi/webRoutes/webUserRoutes.js';
import villageRoutes from './src/webApi/webRoutes/villageListRoutes.js';
import beneficiaryUploadRoutes from './src/webApi/webRoutes/beneficiaryUploadRoute.js';

// Initialize environment variables
dotenv.config();

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true,
}));
// app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Setup routes
app.use('/api/v1/mobileUser', mobileUserRoutes);
app.use('/api/v1/webUser', webUserRoutes);
app.use('/api/v1/webUser', villageRoutes);
app.use('/api/v1/webUser', beneficiaryUploadRoutes);

// Error middleware
app.use(errorMiddleware);

// Server ports
const HTTPS_PORT = process.env.HTTPS_PORT || 5000;
const HTTP_PORT = process.env.HTTP_PORT || 5001;
const IS_SSL = process.env.IS_SSL === 'true';

const httpServer = http.createServer(app);
let httpsServer;

const startServers = async () => {
  try {
    await dbConnection();

    if (IS_SSL) {
      try {
        const privateKey = fs.readFileSync(process.env.SSL_SERVER_KEY, "utf8");
        const certificate = fs.readFileSync(process.env.SSL_SERVER_CERT, "utf8");
        const credentials = { key: privateKey, cert: certificate };

        // Create and start HTTPS server
        httpsServer = https.createServer(credentials, app);
        httpsServer.listen(HTTPS_PORT, () => {
          console.log(`:lock: HTTPS Server is running at port: ${HTTPS_PORT}`);
        });

        // Handle HTTPS server errors
        httpsServer.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`HTTPS Server failed to start: ${err.message}`);
            console.log(`Switching to HTTP Server on port: ${HTTP_PORT}...`);

            // Start HTTP server as a fallback
            httpServer.listen(HTTP_PORT, () => {
              console.log(`:gear: HTTP Server is running at port: ${HTTP_PORT}`);
            });
          } else {
            console.error(`HTTPS Server encountered an error: ${err.message}`);
            process.exit(1); // Exit if it's an unexpected error
          }
        });
      } catch (sslError) {
        console.error(`Failed to start HTTPS Server: ${sslError.message}`);
        console.log(`Switching to HTTP Server on port: ${HTTP_PORT}...`);

        // Start HTTP server as a fallback
        httpServer.listen(HTTP_PORT, () => {
          console.log(`:gear: HTTP Server is running at port: ${HTTP_PORT}`);
        });
      }
    } else {
      // Start HTTP server if SSL is not enabled
      httpServer.listen(HTTP_PORT, () => {
        console.log(`:gear: HTTP Server is running at port: ${HTTP_PORT}`);
      });
    }
  } catch (dbError) {
    console.error("MongoDB connection failed:", dbError);
    process.exit(1); // Exit on MongoDB connection failure
  }
};

// Start the servers
startServers();
