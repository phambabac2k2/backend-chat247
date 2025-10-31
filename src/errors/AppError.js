/**
 * AppError: Operational errors class
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether error is trusted/operational
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = Number(statusCode);
    this.isOperational = Boolean(isOperational);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
