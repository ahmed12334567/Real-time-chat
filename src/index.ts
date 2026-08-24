import express from 'express';
import type { Request, Response } from 'express'
import type { ApiResponse } from './interface/respons.interface.js';
import http from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middlewares/socketAuth.middleware.js';
import type { AuthenticatedSocket } from './middlewares/socketAuth.middleware.js';
import { registerChatHandlers } from './sockets/privteChat.socket.js';
import { authLimiter, globalLimiter } from "./utility/ratelimiting.js"

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
io.use(socketAuthMiddleware);

io.on('connection', (socket: AuthenticatedSocket) => {
  registerChatHandlers(io, socket);
});

app.use(globalLimiter)

import authRouter from "./routes/auth.route.js"
app.use("/api/v1/auth", authLimiter, authRouter)

import chatRouter from "./routes/chat.route.js"
app.use("/api/v1/chat", chatRouter)

app.use((req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`
  })
})


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import { handleError } from "./middlewares/error.middleware.js"
app.use(handleError)