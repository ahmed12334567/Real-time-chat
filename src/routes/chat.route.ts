import { Router } from "express"
import { privetChat, getChatMessages } from "../controllers/chat.controller.js"
import validUUID from "../validators/uuid.validator.js"
import handleValidationErrors from "../validators/handleValidationErrors.js"
import { verify } from "../middlewares/auth.middleware.js"
const router = Router()

router.post("/privet", verify, privetChat)
router.get("/:chatId/messages", verify, validUUID("chatId"), handleValidationErrors, getChatMessages)

export default router