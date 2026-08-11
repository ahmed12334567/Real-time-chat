import { body } from "express-validator"

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("invalid email"),

  body("password")
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("invalid password min length 8")
]

export const registerValidator = [
  body("username")
    .notEmpty()
    .isString()
    .withMessage("invalid username"),
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("invalid email"),
  body("password")
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("invalid password min length 8")
]