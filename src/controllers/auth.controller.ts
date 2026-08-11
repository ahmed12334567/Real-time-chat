import type { Request, Response } from 'express'
import userModel from '../models/auth.model.js'
import bcrypt from "bcrypt"
import { generateToken } from '../utility/jwt.js'
import type { ApiResponse } from '../interface/respons.interface.js'
import type { User } from '../interface/user.interface.js'


export const createUser = async (req: Request<{}, ApiResponse, User>, res: Response<ApiResponse>) => {
    const { username, email, password } = req.body
    const existUser = await userModel.getUserByEmail(email)
    if (existUser) {
        return res.status(400).json({
            status: "fail",
            message: "user already exist"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const userData: User = {
        username,
        email,
        password: hashedPassword
    }
    const createUser = await userModel.createUser(userData)
    if (!createUser) {
        return res.status(500).json({
            status: "fail",
            message: "something went wrong, try again later"
        })
    }
    const token = generateToken({
        id: createUser.id,
        email: email
    })

    return res.status(201).json({
        status: "success",
        message: "user created successfully",
        data: {
            user: {
                id: createUser.id,
                username: createUser.username,
                email: createUser.email
            }
        },
        token
    })
}

export const login = async (req: Request<{}, ApiResponse, User>, res: Response<ApiResponse>) => {
    const { email, password } = req.body

    const existUser = await userModel.getUserByEmail(email)

    if (!existUser) {
        return res.status(400).json({
            status: "fail",
            message: "user already exist"
        })
    }

    const comparePassword = await bcrypt.compare(password, existUser.password)

    if(!comparePassword){
        return res.status(400).json({
            status: "fail",
            message: "wrong email or password"
        })
    }
    const token = generateToken({
        id: existUser.id,
        email: existUser.email
    })
    return res.status(200).json({
        status: "success",
        message: "login successfully",
        data:{
            user: {
                id: existUser.id,
                username: existUser.username,
                email: existUser.email
            }
        },
        token
    })
}