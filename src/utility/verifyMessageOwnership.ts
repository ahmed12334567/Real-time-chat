import chatModel from '../models/chat.model.js';

type MessageOwnershipResult =
    | { success: true; message: string }
    | { success: false; error: string };


const verifyMessageOwnership = async (
    messageId: string,
    chatId: string,
    userId: string
): Promise<MessageOwnershipResult> => {
    const message = await chatModel.getMessage(messageId, chatId);

    if (!message || message.sender_id !== userId) {
        return { success: false, error: 'You not have this message' };
    }
    return { success: true, message };
}

export default verifyMessageOwnership