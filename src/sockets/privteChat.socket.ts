import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';
import chatModel from '../models/chat.model.js';
import { pool } from "../config/db.js";
import handleTypingEvent from '../utility/handlTyping.js';
import verifyMessageOwnership from "../utility/verifyMessageOwnership.js"
import { addUserSocket, removeUserSocket } from '../utility/onlineUsers.js';
import { socketAsyncHandler } from "../middlewares/error.middleware.js";
import { withRateLimit } from "../utility/withRateLimit.js"

export const registerChatHandlers = socketAsyncHandler(async (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.id
  const username = socket.user?.username

  if (userId) {
    const justCameOnline = addUserSocket(userId, socket.id)

    if (justCameOnline) {
      const chatIds = await chatModel.getUserChatIds(userId);

      chatIds.forEach(async (chatId) => {
        const isMember = await chatModel.isUserInChat({ chatId, userId });
        if (!isMember) return;

        io.to(chatId).emit("user_online", { userId, username })
      })

    }
  }

  socket.on("disconnecting", socketAsyncHandler(async () => {
    if (!userId || !username) return;

    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
    rooms.forEach((chatId) => {
      socket.to(chatId).emit("user_stop_typing", { username, chatId });
    })
  }))

  socket.on("disconnect", socketAsyncHandler(async () => {

    if (!userId) return;

    const wentOffline = removeUserSocket(userId, socket.id);

    if (wentOffline) {

      const lastSeen = new Date();
      await chatModel.updateLastSeen(userId, lastSeen);

      const chatIds = await chatModel.getUserChatIds(userId);

      chatIds.forEach((chatId) => {
        io.to(chatId).emit("user_offline", { userId, username, lastSeen })
      })
    }
  }))

  socket.on("join_chat", socketAsyncHandler(async (data: { chatId: string }) => {

    const { chatId } = data;

    if (!chatId || !userId || !username) {
      return socket.emit('error', { message: 'Chat ID is required' });
    }
    const isMember = await chatModel.isUserInChat({ chatId, userId });
    if (!isMember) {
      return socket.emit('error', { message: 'You are not a member of this chat' });
    }

    socket.join(chatId)
    console.log(`User ${userId} joined room: ${chatId}`);

    socket.emit('joined_chat_success', { chatId, message: 'Joined successfully' });

  }))

  socket.on("send_message",
    withRateLimit(socket, "send_message",
      socketAsyncHandler(async (data: { chatId: string; content: string }) => {

        const { chatId, content } = data;

        if (!chatId || !content || !userId || !username) {
          return socket.emit('error', { message: 'Invalid message data' });
        }

        const rooms = Array.from(socket.rooms)
        if (!rooms.includes(chatId)) {
          return socket.emit('error', { message: 'You must join the chat first' });
        }

        const savedMessage = await chatModel.createMessage({
          chatId,
          senderId: userId,
          content,
          status: 'Sent'
        })

        io.to(chatId).emit("receive_message", savedMessage)

      }),
      { max: 20, windowMs: 10_000 }
    )
  )

  socket.on('leave_chat', socketAsyncHandler(async (data: { chatId: string }) => {
    const { chatId } = data;

    if (!chatId || !userId || !username) {
      return socket.emit('error', { message: 'Chat ID is required' });
    }

    const client = await pool.connect()

    try {
      const existingMember = await chatModel.checkGroupChat(client, chatId, userId!);

      if (!existingMember) {
        return socket.emit('error', { message: 'You must join the chat first' });
      }

      const leaveMemberChat = await chatModel.leaveMemberChat(client, chatId, userId!)

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
    socketAsyncHandler(async (data: { chatId: string; targetUserId: string }) => {
      const { chatId, targetUserId } = data;
      const client = await pool.connect();

      try {
        const checkAdmin = await chatModel.getAdminMembership(userId!, chatId)

        if (!checkAdmin) {
          return socket.emit("error", { message: "Only admins can remove members" })
        }

        const existingMember = await chatModel.checkGroupChat(client, chatId, targetUserId);

        if (!existingMember) {
          return socket.emit('error', { message: 'User is not a member of this chat' });
        }

        if (targetUserId === userId) {
          return socket.emit('error', { message: 'Use leave_chat to leave yourself' });
        }

        const removed = await chatModel.removeMemberChat(client, chatId, targetUserId, userId!);

        if (!removed) {
          return socket.emit('error', { message: 'Something went wrong, please try again' });
        }

        const targetSockets = await io.in(chatId).fetchSockets();
        targetSockets
          .filter((s) => s.data.userId === targetUserId)
          .forEach(s => s.leave(chatId))

        io.to(chatId).emit("member_removed", {
          chatId,
          userId: targetUserId,
          removedBy: userId,
          leftAt: removed.leftAt
        })
        
      } finally {
        client.release()
      }
    }))


  socket.on("mark_as_read",
    withRateLimit(socket, "mark_as_read",
      socketAsyncHandler(async (data: { chatId: string }) => {
        const { chatId } = data;
        if (!chatId || !userId || !username) return;


        const updatedMessages = await chatModel.markMessagesAsRead(chatId, userId);

        if (updatedMessages.length > 0) {
          io.to(chatId).emit("messages_read_receipt", {
            chatId,
            readBy: userId,
            updatedMessageIds: updatedMessages.map((m) => m.id),
          });
        }
      }),
      { max: 20, windowMs: 10_000 }
    ))

  socket.on("typing",
    withRateLimit(socket, "typing",
      handleTypingEvent("typing", socket),
      { max: 20, windowMs: 10_000 }
    ))

  socket.on("stop_typing",
    withRateLimit(socket, "stop_typing",
      handleTypingEvent("stop_typing", socket),
      { max: 20, windowMs: 10_000 }
    ))

  socket.on("update_message",
    withRateLimit(socket, "update_message",
      socketAsyncHandler(async (data: { messageId: string, chatId: string, content: string }) => {

        const { messageId, chatId, content } = data

        if (!messageId || !chatId || content.trim().length === 0) {
          return socket.emit('error', { message: 'invalid values, check your values' });
        }

        const rooms = Array.from(socket.rooms)

        if (!rooms.includes(chatId)) {
          return socket.emit('error', { message: 'You must join the chat first' });
        }

        const ownership = await verifyMessageOwnership(messageId, chatId, userId!);
        if (!ownership.success) {
          return socket.emit('error', { message: ownership.error });
        }

        const updateMessage = await chatModel.updateMessage(content, messageId, chatId)

        if (!updateMessage) {
          return socket.emit("error", { message: "cannot update message, try again later" })
        }
        return socket.to(chatId).emit("user_update_message", {
          username,
          messageId: updateMessage.id,
          content: updateMessage.content,
          editedAt: updateMessage.updated_at
        });

      }),
      { max: 20, windowMs: 10_000 }
    ))


  socket.on("delete_message",
    withRateLimit(socket, "delete_message",
      socketAsyncHandler(async (data: { messageId: string, chatId: string }) => {
        const { chatId, messageId } = data;

        if (!messageId || !chatId) {
          return socket.emit('error', { message: 'invalid values, check your values' });
        }

        const rooms = Array.from(socket.rooms)

        if (!rooms.includes(chatId)) {
          return socket.emit('error', { message: 'You must join the chat first' });
        }

        const ownership = await verifyMessageOwnership(messageId, chatId, userId!);

        if (!ownership.success) {
          return socket.emit('error', { message: ownership.error });
        }

        const deleteMessage = await chatModel.deleteMessage(messageId, chatId)

        if (!deleteMessage) {
          return socket.emit("error", { message: "cannot delete message, try again later" })
        }

        return socket.to(chatId).emit("user_delete_message", {
          username,
          messageId: deleteMessage.id,
          deleted_at: deleteMessage.deleted_at
        })

      }),
      { max: 20, windowMs: 10_000 }
    ))

});