import { param } from "express-validator"
import type { ValidationChain } from "express-validator";

export default function validUUID(paramName: string): ValidationChain {
    return param(paramName)
        .isUUID(4)
        .withMessage(`${paramName} must be a valid UUID`);
}