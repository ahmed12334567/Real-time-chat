import type { Response } from 'express';
import type { ApiResponse } from '../interface/respons.interface.js';
import type { member } from "../interface/chat.interface.js";
import type { CustomRequest } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../middlewares/error.middleware.js"
import { pool } from "../config/db.js";
import chatModel from '../models/chat.model.js';
import userModel from '../models/auth.model.js';

export const privetChat = asyncHandler(async (req: CustomRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id as string;
    const receiverId = req.body?.receiverId

    if (!receiverId) {
        return res.status(400).json({
            status: "fail",
            message: "receiverId is required"
        });
    }

    if (userId === receiverId) {
        return res.status(400).json({
            status: "fail",
            message: "You cannot create a private chat with yourself"
        });
    }

    const exsitUser = await userModel.getUserById(receiverId)
    if (!exsitUser) {
        return res.status(404).json({
            status: "fail",
            message: "not found receiver by id"
        })
    }
    const existingChat = await chatModel.checkPrivetChat({ userId, senderId: receiverId })

    if (existingChat) {
        const existingChatName = await chatModel.getUsername({ chatId: existingChat.id, userId })
        return res.status(200).json({
            status: "success",
            message: "chat already existing",
            data: {
                id: existingChat.id,
                name: existingChatName.username,
                created_at: existingChat.created_at,
                type: existingChat.type
            }
        })
    }
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const chat = await chatModel.createPrivetChat(client)

        const senderMemberData: member = {
            userId,
            role: "member",
            chatId: chat.id
        };
        const receiverMemberData: member = {
            userId: receiverId,
            role: "member",
            chatId: chat.id
        };
         await chatModel.addMemberToChat(client, senderMemberData)
         await chatModel.addMemberToChat(client, receiverMemberData)

        const username = await chatModel.getUsername({ chatId: chat.id, userId })

        await client.query("COMMIT")

        return res.status(201).json({
            status: "success",
            message: "Private chat created successfully",
            data: {
                chat_id: chat.id,
                name: username,
                created_at: chat.created_at,
                type: chat.type
            }
        });

    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
});

export const getChatsUser = asyncHandler(async (req: CustomRequest,
    res: Response<ApiResponse>) => {
    const userId = req.user?.id

    const userChats = await chatModel.getChatsUser(userId!)

    if (userChats.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "not found user chats"
        })
    }
    const chatsIds = userChats.map((chat) => {
        return chat.chat_id;
    });
    const chatMembers = await chatModel.getChatMembers(chatsIds, userId!)

    const chats = userChats.map((chat) => {
        const members = chatMembers.filter(
            (member) => member.chat_id === chat.chat_id
        );
        return {
            ...chat,
            members
        };
    });

    return res.status(200).json({
        status: "success",
        message: "chats returned successfully",
        data: {
            chats
        }
    })
})

export const getChatMessages = asyncHandler(async (req: CustomRequest, res: Response<ApiResponse>) => {
    const { chatId } = req.params;
    const userId = req.user?.id;
    if (typeof chatId !== 'string') {
        return res.status(400).json({
            status: "fail",
            message: "invalid chat ID"
        })
    }
    await chatModel.markMessagesAsRead(chatId, userId!);
    const isMember = await chatModel.isUserInChat({ chatId, userId });

    if (!isMember) {
        return res.status(403).json({ status: "fail", message: 'Unauthorized access to chat' });
    }
    const messages = await chatModel.getChatMessages(chatId);

    return res.status(200).json({
        status: 'success',
        message: "messages returned successfully",
        data: messages
    });
});

export const createGrouoChat = asyncHandler(async (req: CustomRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id as string
    const name = req.body?.name?.trim()

    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const chat = await chatModel.createGroupChat(client, name)

        const memberData: member = {
            chatId: chat.id,
            userId,
            role: "admin"
        }

        const addMemberToChat = await chatModel.addMemberToChat(client, memberData)

        await client.query("COMMIT")

        return res.status(201).json({
            status: "success",
            message: "group is created successfully",
            data: {
                chat_id: chat.id,
                name: chat.name,
                user_id: addMemberToChat.user_id,
                role: addMemberToChat.role,
                join_at: addMemberToChat.join_at
            }
        })

    } catch (error) {
        await client.query("ROLLBACK")
        throw error

    } finally {
        client.release()
    }
})