import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  getFriend,
  deleteFriend,
} from "../controllers/friendController.js";


const router = express.Router();

router.post("/friend-request", sendFriendRequest);
router.post("/friend-request/:requestId/accept", acceptFriendRequest);
router.post("/friend-request/:requestId/reject", rejectFriendRequest);
router.get("/friend-request", getFriendRequests);
router.get("/friends", getFriends);
router.get("/friends/:friendId", getFriend);
router.delete("/friends/:friendId", deleteFriend);


export default router;