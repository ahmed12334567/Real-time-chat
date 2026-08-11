import { Router } from "express"
import { loginValidator, registerValidator } from "../validators/auth.validator.js"
import { createUser, login } from "../controllers/auth.controller.js"
import handleValidationErrors from "../validators/handleValidationErrors.js"
const router = Router()

router.post("/register", registerValidator, handleValidationErrors, createUser)
router.post("/login", loginValidator, handleValidationErrors, login)

export default router