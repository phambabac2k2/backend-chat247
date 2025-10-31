import asynsHandler from "express-async-handler";

export const authMe = asynsHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ user });
})