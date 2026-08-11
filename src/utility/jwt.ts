import jwt from "jsonwebtoken";
import type { JwtPayload } from "../interface/jwtPayload.interface.js"
import dotenv from "dotenv"
dotenv.config()

export const generateToken = (data: JwtPayload): string => {
    return jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: "1d" });
};
