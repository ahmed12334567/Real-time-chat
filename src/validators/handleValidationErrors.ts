import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export default function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];

    return res.status(400).json({
      status: "fail",
      message: firstError!.msg,
      errors: errors.array(),
    });
  }

  next();
}