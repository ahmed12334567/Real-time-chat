import { Router } from "express"
import {
    privetChat,
    getChatMessages,
    getChatsUser,
    createGrouoChat,
    addMemberToGroup
} from "../controllers/chat.controller.js";
import validUUID from "../validators/uuid.validator.js"
import handleValidationErrors from "../validators/handleValidationErrors.js"
import { groupChatValidation } from "../validators/groupChat.validator.js"
import { addMemberValidation } from "../validators/addMember.validator.js"
import { verify } from "../middlewares/auth.middleware.js"
const router = Router()

router.post("/privet", verify, privetChat)

router.post("/group", verify, groupChatValidation, handleValidationErrors, createGrouoChat)

router.post("/:chatId/group", verify, validUUID("chatId"), addMemberValidation,
    handleValidationErrors, addMemberToGroup)

router.get("/", verify, getChatsUser)

router.get("/:chatId/messages", verify, validUUID("chatId"), handleValidationErrors, getChatMessages)

export default router