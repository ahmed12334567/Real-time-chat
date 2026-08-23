import { body } from "express-validator"

export const groupChatValidation = [
  body("name")
    .isString()
    .isLength({min: 3})
    .withMessage("invalid name")
]