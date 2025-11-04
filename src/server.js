import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import requireAuth from "./middlewares/authorization.js";
import { connectDB } from "./libs/db.js";
import errorHandler from "./middlewares/errorHandler.js";
import AppError from "./errors/AppError.js";
import authRoute from "./routes/authRouter.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 4000;
app.use("/api/auth", authRoute);

app.use("/api/users", requireAuth, userRoutes);

app.use((req, res, next) => next(new AppError("Route not found", 404)));

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
