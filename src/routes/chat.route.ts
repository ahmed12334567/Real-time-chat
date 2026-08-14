import { Router } from "express"
import { privetChat } from "../controllers/chat.controller.js"
import { verify } from "../middlewares/auth.middleware.js"
const router = Router()

router.post("/privet", verify, privetChat)

export default router