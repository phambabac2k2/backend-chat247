import asyncHandler from "express-async-handler";
import AppError from "../errors/AppError.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterMessage } from "../utils/messageHelper.js";
export const sendDirectMessage = asyncHandler(async (req, res) => {
  const { recipientId, conversationId, content } = req.body;
  const senderId = req.user._id;

  if (!content || content.trim() === "") {
    throw new AppError("Nội dung tin nhắn không được để trống", 400);
  }

  let conversation;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new AppError("Không tìm thấy cuộc trò chuyện", 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === senderId.toString()
    );

    if (!isParticipant) {
      throw new AppError(
        "Bạn không có quyền gửi tin trong cuộc trò chuyện này",
        403
      );
    }
  } else {
    
    conversation = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
  });

  updateConversationAfterMessage(conversation, message, senderId);
  await conversation.save();

  await message.populate({
    path: "senderId",
    select: "displayName avatarUrl",
  });

  res.status(201).json({ message });
});


export const sendGroupMessage = asyncHandler(async (req, res) => {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if(!content){
        throw new AppError("Nội dung tin nhắn không được để trống", 400);
    }

    const message = await Message.create({
        conversationId,
        senderId,
        content,
    });

    updateConversationAfterMessage(conversation, message, senderId);
    await conversation.save();

    res.status(201).json({message});
})

