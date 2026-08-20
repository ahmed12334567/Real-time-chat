import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';
import chatModel from '../models/chat.model.js';
import handleTypingEvent from '../utility/handlTyping.js';
import verifyMessageOwnership from "../utility/verifyMessageOwnership.js"
import { addUserSocket, removeUserSocket } from '../utility/onlineUsers.js';

export const registerChatHandlers = async (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.id
  const username = socket.user?.username

  if (userId) {
    const justCameOnline = addUserSocket(userId, socket.id)

    if (justCameOnline) {
      try {
        const chatIds = await chatModel.getUserChatIds(userId);

        chatIds.forEach((chatId) => {
          io.to(chatId).emit("user_online", { userId, username })
        })

      } catch (err) {
        console.log("Error broadcasting online status: ", err);
        socket.emit("error", { message: "Failed to get chat IDs" })
      }
    }
  }

  socket.on("disconnect", async () => {

    if (!userId) return;

    const wentOffline = removeUserSocket(userId, socket.id);

    if (wentOffline) {
      try {
        const lastSeen = new Date();
        await chatModel.updateLastSeen(userId, lastSeen);

        const chatIds = await chatModel.getUserChatIds(userId);

        chatIds.forEach((chatId) => {
          io.to(chatId).emit("user_offline", {userId, username, lastSeen})
        })

      } catch (err) {
        console.log('Error broadcasting offline status:', err);
        socket.emit("error", { message: "Failed change status" })
      }
    }
  })

  socket.on("join_chat", async (data: { chatId: string }) => {
    try {
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

    } catch (err) {
      console.log("Error: ", err);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  })

  socket.on("send_message", async (data: { chatId: string; content: string }) => {
    try {
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

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  })

  socket.on('leave_chat', (data: { chatId: string }) => {
    socket.leave(data.chatId);
    console.log(`User ${userId} left room: ${data.chatId}`);
  });


  socket.on("mark_as_read", async (data: { chatId: string }) => {

    try {
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
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  })
  socket.on("typing", handleTypingEvent("typing", socket));

  socket.on("stop_typing", handleTypingEvent("stop_typing", socket));

  socket.on("update_message", async (data: { messageId: string, chatId: string, content: string }) => {

    try {
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

    } catch (err) {
      console.log("update message Error: ", err);

      return socket.emit("error", { message: "cannot update message, try again later" })
    }
  })


  socket.on("delete_message", async (data: { messageId: string, chatId: string }) => {

    try {
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

    } catch (err) {
      console.log("delete messages error: ", err);
      return socket.emit("error", { message: "cannot delete message, try again later" })
    }


  })

}