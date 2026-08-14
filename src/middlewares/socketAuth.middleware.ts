import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from "../interface/jwtPayload.interface.js"
import dotenv from "dotenv"
dotenv.config()

export interface AuthenticatedSocket extends Socket {
    user?: JwtPayload;
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization'] ||
    socket.handshake.headers['token'];

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET!) as JwtPayload;
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
}