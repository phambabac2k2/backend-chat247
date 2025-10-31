// @ts-nocheck
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import AppError from "../errors/AppError.js";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import crypto from "crypto";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày
export const signUp = asyncHandler(async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  if (!username || !password || !email || !firstName || !lastName) {
    throw new AppError(
      "Không thể thiếu username, password, email, firstName, và lastName",
      400
    );
  }

  const duplicate = await User.findOne({ username });
  if (duplicate) {
    throw new AppError("Username đã tồn tại", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    hashedPassword,
    email,
    displayName: `${firstName} ${lastName}`,
  });

  res.sendStatus(204);
});

export const signIn = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new AppError("Không thể thiếu username và password", 400);
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new AppError("Tài khoản không tồn tại", 401);
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);
  if (!isPasswordCorrect) {
    throw new AppError("username hoặc password không chính xác", 401);
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  await Session.create({
    refreshToken,
    userId: user._id,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL,
  });

  // trả refresh token về trong cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none", //backend, frontend deploy riêng
    maxAge: REFRESH_TOKEN_TTL,
  });
  res.status(200).json({
    accessToken,
    message: "Đăng nhập thành công",
  })

})

export const signOut = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if(refreshToken){
      await Session.deleteOne({refreshToken})

      res.clearCookie("refreshToken")
    }

    res.sendStatus(204)
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if(!refreshToken){
    throw new AppError("Token không tồn tại", 401)
  }

  const session = await Session.findOne({refreshToken})

  if(!session){
    throw new AppError("Token không hợp lê hoặc đã hết hạn", 401)
  }

  if(session.expiresAt < Date.now()){
    throw new AppError("Token đã hết hạn", 401)
  }

  const accessToken = jwt.sign(
    { userId: session.userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  return res.status(200).json({accessToken})


})