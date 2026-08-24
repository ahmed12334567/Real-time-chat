import { body } from "express-validator"

export const addMemberValidation = [
    body("role")
        .isString()
        .trim()
        .isIn(["member", "admin"])
        .withMessage("invalid role must be (member, admin)"),
    body("memberId")
        .isUUID(4)
        .withMessage("invalid member ID")
]