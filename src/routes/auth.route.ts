import { Router } from "express"
import { loginValidator, registerValidator } from "../validators/auth.validator.js"
import { createUser } from "../controllers/auth.controller.js"
import handleValidationErrors from "../validators/handleValidationErrors.js"
const router = Router()

router.post("/register", registerValidator, handleValidationErrors, createUser)

export default router