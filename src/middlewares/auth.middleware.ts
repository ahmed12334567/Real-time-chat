import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import type { ApiResponse } from '../interface/respons.interface.js';
import dotenv from "dotenv"
import type { JwtPayload } from "../interface/jwtPayload.interface.js"
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET!

export interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const verify =
    function verify(req: CustomRequest, res: Response<ApiResponse>, next: NextFunction) {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ status: "fail", message: "Token is required" });
        }
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({
                        status: "fail",
                        message: "expired token"
                    })
                }
                return res.status(401).json({
                    status: "fail",
                    message: "Invalid token"
                })
            }
            const { id, email, username } = decoded as JwtPayload
            req.user = { id, email, username };
            next();
        })
    }