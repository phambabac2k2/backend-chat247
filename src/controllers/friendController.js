import asyncHandler from "express-async-handler";
import AppError from "../errors/AppError.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
export const sendFriendRequest =  asyncHandler(async (req, res) => {
    const {to, message} = req.body;
    console.log(req.user);

    const from = req.user._id;

   if (from.toString() === to.toString()) {
     throw new AppError(
       "Bạn không thể gửi lời mời kết bạn cho chính mình",
       400
     );
   }


    const userExists = await User.exists({_id: to});
    if(!userExists) {
        throw new AppError("Người dùng không tồn tại", 404);
    }

    let userA = from.toString();
    let userB = to.toString();
    
    if(userA > userB) {
        [userA, userB] = [userB, userA];

    }

    const [alreadyFriends, existingRequest] = await Promise.all([
        Friend.exists({userA, userB}),
        FriendRequest.findOne({
            $or: [
                {from, to},
                {from: to, to: from}
            ]
        })
    ]);

    if(alreadyFriends) {
        throw new AppError("Bạn đã là bạn bè với người dùng này", 400);
    }

    if(existingRequest) {
        throw new AppError("Đã có lời mời kết bạn tồn tại giữa bạn và người dùng này", 400);
    }

    const newRequest = await FriendRequest.create({from, to, message});

    res.status(201).json(newRequest);

})

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    throw new AppError("Lời mời kết bạn không tồn tại", 404);
  }

  if (request.to.toString() !== userId.toString()) {
    throw new AppError("Bạn không có quyền chấp nhận lời mời kết bạn này", 403);
  }

  let userA = request.from.toString();
  let userB = request.to.toString();
  if (userA > userB) [userA, userB] = [userB, userA];

  const alreadyFriends = await Friend.exists({ userA, userB });
  if (alreadyFriends) {
    await FriendRequest.findByIdAndDelete(requestId);
    throw new AppError("Hai người đã là bạn bè", 400);
  }

  await Friend.create({ userA, userB });

  await FriendRequest.findByIdAndDelete(requestId);

  const from = await User.findById(request.from)
    .select("_id displayName avatarUrl")
    .lean();

  res.status(201).json({
    message: "Lời mời kết bạn đã được chấp nhận",
    newFriend: {
      _id: from?._id,
      displayName: from?.displayName,
      avatarUrl: from?.avatarUrl,
    },
  });
});


export const rejectFriendRequest =  asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if(!request) {
        throw new AppError("Lời mời kết bạn không tồn tại", 404);
    }

    if(request.to.toString() !== userId.toString()) {
        throw new AppError("Bạn không có quyền từ chối lời mời kết bạn này", 403);
    }

    await FriendRequest.findByIdAndDelete(requestId);
    res.status(200).json({message: "Lời mời kết bạn đã bị từ chối"});
})

export const getFriendRequests =  asyncHandler(async (req, res) => {
      const userId = req.user._id;

      const populateFields = "_id username displayName avatarUrl";

      const [sent, received] = await Promise.all([
        FriendRequest.find({ from: userId }).populate("to", populateFields),
        FriendRequest.find({ to: userId }).populate("from", populateFields),
      ]);

      res.status(200).json({ sent, received });
})

export const getFriends =  asyncHandler(async (req, res) => {

})

export const getFriend =  asyncHandler(async (req, res) => {

})

export const deleteFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  if (userId.toString() === friendId.toString()) {
    throw new AppError("Không thể tự xoá chính mình", 400);
  }

  let userA = userId.toString();
  let userB = friendId.toString();
  if (userA > userB) [userA, userB] = [userB, userA];

  const friend = await Friend.findOneAndDelete({ userA, userB });
  if (!friend) {
    throw new AppError("Không tìm thấy bạn bè", 404);
  }

  res.status(200).json({ message: "Bạn bè đã bị xóa" });
});

