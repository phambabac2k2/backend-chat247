import asyncHandler from "express-async-handler";
import AppError from "../errors/AppError.js";
import Conversation from "../models/Conversation.js";

export const createConversation = asyncHandler(async (req, res) => {
  const { type, name, memberIds } = req.body;

  const creatorId = req.user._id;

  if (
    !type ||
    (type === "group" && !name) ||
    !memberIds ||
    !Array.isArray(memberIds) ||
    memberIds.length === 0
  ) {
    throw new AppError("Dữ liệu không hợp lệ để tạo cuộc trò chuyện", 400);
  }

  let conversation;
  if (type === "direct") {
    const participantId = memberIds[0];

    conversation = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [creatorId, participantId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [{ userId: creatorId }, { userId: participantId }],
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }
  } else if (type === "group") {
    conversation = new Conversation({
      type: "group",
      participants: [
        { userId: creatorId },
        ...memberIds.map((id) => ({ userId: id })),
      ],
      group: {
        name,
        createdBy: creatorId,
      },
      lastMessageAt: new Date(),
    });
    await conversation.save();
  }
  if (!conversation) {
    throw new AppError("Không thể tạo cuộc trò chuyện", 500);
  }

  await conversation.populate([
    { path: "participants.userId", select: "displayName avatarUrl" },
    { path: "seenBy", select: "displayName avatarUrl" },
    { path: "lastMessage.senderId", select: "displayName avatarUrl" },
  ]);
  res.status(201).json(conversation);
});

export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate([
        { path: "participants.userId", select: "displayName avatarUrl" },
        { path: "seenBy", select: "displayName avatarUrl" },
        { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      ]);
    
      const formatted = conversations.map((conv) => {
        const participants = (conv.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt ?? null,
        }));
        return {
            ...conv.toObject(),
            unreadCounts: conv.unreadCounts || {},
            participants,
        }
      })
      res.status(200).json({conversations: formatted});
});

export const getMessages = asyncHandler(async (req, res) => {});
