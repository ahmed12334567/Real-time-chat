import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './middlewares/socketAuth.middleware.js';
import type {  AuthenticatedSocket } from './middlewares/socketAuth.middleware.js';
import { registerChatHandlers } from './sockets/privteChat.socket.js';

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

import authRouter from "./routes/auth.route.js"
app.use("/api/v1/auth", authRouter)

import chatRouter from "./routes/chat.route.js"
app.use("/api/v1/chat", chatRouter)


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});