import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';
import chatModel from '../models/chat.model.js';
import handleTypingEvent from '../utility/handlTyping.js';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.id
  const username = socket.user?.username

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
}