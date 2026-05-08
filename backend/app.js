import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import SessionRoutes from "./routes/SessionRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Initialize app
const app = express();
const httpServer = createServer(app);

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://presence-plus.vercel.app",
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman/mobile apps)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Socket CORS blocked"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB;

// Expose io object to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Other middleware
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to GeoSential Backend");
});

app.use("/users", userRoutes);
app.use("/sessions", SessionRoutes);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});