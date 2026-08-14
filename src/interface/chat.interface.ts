export interface message {
    chatId: string;
    senderId: string;
    status: ["Sent", "Delivered", "Read"];
    content: string;
}

export interface member {
    chatId: string;
    userId: string;
    role: string;
}