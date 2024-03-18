import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  isUserSubscribed,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:subscriberId").get(getSubscribedChannels);

router
  .route("/u/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

router.route("/status/:channelId").get(isUserSubscribed);

export default router;
