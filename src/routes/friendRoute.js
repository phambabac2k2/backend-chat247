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
router.get("/", getFriends);
router.get("/:friendId", getFriend);
router.delete("/:friendId", deleteFriend);


export default router;