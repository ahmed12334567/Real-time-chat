
import type { AuthenticatedSocket } from '../middlewares/socketAuth.middleware.js';

const handleTypingEvent = (eventName: "typing" | "stop_typing", socket: AuthenticatedSocket) => async (data: { chatId: string }) => {
    const userId = socket.user?.id
    const username = socket.user?.username
    const { chatId } = data;
    if (!chatId || !userId || !username) return;

    const rooms = Array.from(socket.rooms)

    if (!rooms.includes(chatId)) {
        return socket.emit('error', { message: 'You must join the chat first' });
    }
    else if (eventName === "typing") {
        socket.to(chatId).emit("user_typing", { username, chatId });
    }
    else {
        socket.to(chatId).emit("user_stop_typing", { username, chatId });
    }
}

export default handleTypingEvent