import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';
import chatModel from '../models/chat.model.js';
import { pool } from "../config/db.js";
import { socketAsyncHandler } from "../middlewares/error.middleware.js";
import type { member } from '../interface/chat.interface.js';


export const registerGroupChatHandler = socketAsyncHandler(async (
    io: Server, socket: AuthenticatedSocket
) => {
    const userId = socket.user?.id
    const username = socket.user?.username

    socket.on("add_member", socketAsyncHandler(async (data: {
        chatId: string,
        memberId: string,
        role: string
    }) => {
        const { chatId, memberId, role } = data;

        const roles = ["member", "admin"]

        if (
            typeof chatId !== "string" || !chatId ||
            typeof memberId !== "string" || !memberId ||
            !roles.includes(role)
        ) {
            return socket.emit("error", { message: "invalid values" });
        }

        if (memberId === userId) {
            return socket.emit('error', { message: 'cannot add yourself' });
        }

        const checkAdmin = await chatModel.getAdminMembership(userId!, chatId)

        if (!checkAdmin) {
            return socket.emit("error", { message: "Only admins can add members" })
        }

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            const existingMember = await chatModel.checkGroupChat(client, chatId, memberId);
            console.log(existingMember);
            if (existingMember) {
                await client.query("ROLLBACK");
                return socket.emit('error', { message: 'User is a member of this chat' });
            }

            const memberData: member = {
                userId: memberId,
                chatId,
                role
            }

            const addMemberToChat = await chatModel.addMemberToChat(client, memberData)

            if (!addMemberToChat) {
                await client.query("ROLLBACK");
                return socket.emit('error', { message: 'Something went wrong, please try again' });
            }

            await client.query("COMMIT");

            io.to(chatId).emit("user_added", {
                added_by: userId,
                user_id: addMemberToChat.user_id,
                role: addMemberToChat.role,
                join_at: addMemberToChat.join_at
            })

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release()
        }
    }))

    socket.on('leave_chat', socketAsyncHandler(async (data: { chatId: string }) => {
        const { chatId } = data;

        if (
            typeof chatId !== "string" || !chatId
        ) {
            return socket.emit("error", { message: "invalid values" });
        }

        const client = await pool.connect()

        try {
            const existingMember = await chatModel.checkGroupChat(client, chatId, userId!);

            if (!existingMember) {
                return socket.emit('error', { message: 'You must join the chat first' });
            }

            const leaveMemberChat = await chatModel.removeMemberChat(client, chatId, userId!)

            if (!leaveMemberChat) {
                return socket.emit("error", { message: "Something went error Please try again" })
            }

            socket.leave(chatId);
            io.to(chatId).emit("user_leave_chat", {
                chatId,
                userId,
                username,
                leftAt: leaveMemberChat.left_at
            });

        } finally {
            client.release()
        }
    }));

    socket.on('kick_member',
        socketAsyncHandler(async (data: { chatId: string; memberId: string }) => {
            const { chatId, memberId } = data;

            if (typeof chatId !== 'string' || !chatId ||
                typeof memberId !== 'string' || !memberId
            ) {
                return socket.emit("error", { message: "invalid values" });
            }

            if (memberId === userId) {
                return socket.emit('error', { message: 'Use leave_chat to leave yourself' });
            }
            const checkAdmin = await chatModel.getAdminMembership(userId!, chatId)

            if (!checkAdmin) {
                return socket.emit("error", { message: "Only admins can remove members" })
            }

            const client = await pool.connect();

            try {

                const existingMember = await chatModel.checkGroupChat(client, chatId, memberId);

                if (!existingMember) {
                    return socket.emit('error', { message: 'User is not a member of this chat' });
                }

                const removed = await chatModel.removeMemberChat(client, chatId, memberId, userId!);

                if (!removed) {
                    return socket.emit('error', { message: 'Something went wrong, please try again' });
                }

                io.to(chatId).emit("member_removed", {
                    chatId,
                    userId: memberId,
                    removedBy: userId,
                    leftAt: removed.left_at
                })

                const targetSockets = await io.in(chatId).fetchSockets();

                const toKick = targetSockets.filter((s) => s.data.userId === memberId);

                await Promise.all(toKick.map((s) => s.leave(chatId)));

            } finally {
                client.release()
            }
        }))
})