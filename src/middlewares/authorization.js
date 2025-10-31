import jwt from "jsonwebtoken";
import AppError from "../errors/AppError.js";
import User from "../models/User.js";

const getToken = (req) => {
  const header = req.headers?.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) throw new AppError("Unauthorized", 401);

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!payload?.userId) throw new AppError("Unauthorized", 401);

    req.userId = payload.userId;
    const user = await User.findById(payload.userId).select("-hashedPassword");
    if (!user) throw new AppError("Unauthorized", 401);
    req.user = user;

    return next();
  } catch (err) {
    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError" ||
      err.name === "NotBeforeError"
    ) {
      return next(err);
    }
    return next(new AppError(err.message || "Unauthorized", err.statusCode || 401));
  }
};

export default requireAuth;

