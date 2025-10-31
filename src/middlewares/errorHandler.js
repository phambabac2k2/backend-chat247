import AppError from "../errors/AppError.js";

/**
 * Map common error names to HTTP status codes
 */
const ERROR_MAP = {
  ValidationError: 400,
  CastError: 400,
  StrictModeError: 400,
  DocumentNotFoundError: 404,
  ParallelSaveError: 409,
  VersionError: 409,
  JsonWebTokenError: 401,
  TokenExpiredError: 401,
  NotBeforeError: 401,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  DisconnectedError: 503,
  MongooseError: 500,
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || ERROR_MAP[err.name] || 500;
  let message = err.message || "Internal Server Error";

  // ---- Mongoose / MongoDB ----
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  if (err.name === "DocumentNotFoundError") {
    statusCode = 404;
    message = "Document not found";
  }

  if (err.name === "StrictModeError") {
    statusCode = 400;
    message = "Invalid field not defined in schema";
  }

  if (err.name === "ParallelSaveError") {
    statusCode = 409;
    message = "Parallel save conflict";
  }

  if (err.name === "VersionError") {
    statusCode = 409;
    message = "Document version conflict";
  }

  if (err.name === "DisconnectedError") {
    statusCode = 503;
    message = "Database connection lost";
  }

  // ---- JWT / Auth ----
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  if (err.name === "NotBeforeError") {
    statusCode = 401;
    message = "Token not active yet";
  }

  // ---- Custom AppError ----
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ---- Validation libraries (Joi / Zod / Yup) ----
  if (err.isJoi && err.details) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(", ");
  }

  // ---- System / Network errors ----
  const systemErrors = [
    "ENOENT",
    "EACCES",
    "EADDRINUSE",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EPIPE",
  ];
  if (systemErrors.includes(err.code)) {
    statusCode = 500;
    message = `System error: ${err.code}`;
  }

  // ---- Logging ----
  if (process.env.NODE_ENV !== "production") {
    console.error("[Error]", {
      name: err.name,
      code: err.code,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
      stack: err.stack,
    });
  }

  // ---- Response ----
  res.status(statusCode).json({
    success: false,
    statusCode,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : message,
  });
};

export default errorHandler;
