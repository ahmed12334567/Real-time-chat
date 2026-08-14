export interface message {
    chatId: string;
    senderId: string;
    status:string;
    content: string;
}

export interface member {
    chatId: string;
    userId: string;
    role: string;
}