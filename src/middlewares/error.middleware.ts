import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler
} from "express";

interface CustomDatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
}

export const handleError: ErrorRequestHandler = (
  err: CustomDatabaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("server error:", err.message);

  if (err.code === "23505") {
    let message = "This data already exists";

    if (err.detail) {
      const matches = err.detail.match(/\((.*?)\)=\((.*?)\)/);
      if (matches && matches[2]) {
        message = `The value (${matches[2]}) already exists in our database`;
      }
    }

    return res.status(409).json({
      status: "fail",
      data: {
        message: message,
        constraint: err.constraint,
      },
    });
  }

  if (err.code === "23503") {
    return res.status(409).json({
      status: "fail",
      data: {
        message:
          "This operation references or affects a record that doesn't exist or is still in use",
        constraint: err.constraint,
      },
    });
  }

  if (err.code === "23502") {
    return res.status(400).json({
      status: "fail",
      data: {
        message: `The field '${err.column}' is required`,
        constraint: err.constraint,
      },
    });
  }

  if (err.code === "22P02") {
    return res.status(400).json({
      status: "fail",
      data: {
        message: "Invalid data format was provided",
      },
    });
  }

  return res.status(500).json({
    status: "fail",
    data: {
      message: "Internal server error",
      debug: err.message,
    },
  });
};

// asyncHandler for Express
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
// asyncHandler for sockets
type SocketHandler = (...args: any[]) => any;

export const socketAsyncHandler = (fn: SocketHandler) => {
  return (...args: any[]) => {
    Promise.resolve(fn(...args)).catch((error) => {
      console.error(error);
    })
  }
}

