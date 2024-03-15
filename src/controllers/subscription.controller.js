import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: user._id,
  });

  let result;
  let message;
  if (existingSubscription) {
    result = await Subscription.deleteOne({
      channel: channelId,
      subscriber: user._id,
    });
    message = "Subscription removed successfully";
  } else {
    const newSubscription = await Subscription.create({
      channel: channelId,
      subscriber: user._id,
    });
    result = newSubscription;
    message = "Subscription added successfully";
  }

  if (!result) {
    throw new ApiError(500, "Something went wrong with subscription");
  }

  return res.status(200).json(new ApiResponse(200, result, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subs = await Subscription.find({ channel: channelId });
  const count = subs.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subs, count },
        "Subscriptions retrieved successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const channels = await Subscription.find({ subscriber: subscriberId });
  const count = channels.length;
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channels, count },
        "Channels retrieved successfully"
      )
    );
});

//checking if the user is subscribed to a channel
const isUserSubscribed = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const user = req.user._id;
  
  const isSubscribed = await Subscription.findOne({
    subscriber: user,
    channel: channelId,
  });
  const status = isSubscribed ? true : false;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: status },
        "returned the status successfully"
      )
    );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  isUserSubscribed,
};
