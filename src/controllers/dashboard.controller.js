import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(400, "Invalid user id");
  const userId = user._id;

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  // const totalSubscribers = await Subscription.aggregate([
  //   {
  //     $match: {
  //       channel: new mongoose.Types.ObjectId(userId),
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       subscribers: { $sum: 1 },
  //     },
  //   },
  // ]);

  // const totalChannelsSubscribedTo = await Subscription.aggregate([
  //   {
  //     $match: {
  //       subscriber: new mongoose.Types.ObjectId(userId),
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       subscribedTo: { $sum: 1 },
  //     },
  //   },
  // ]);

  const channelStats = await Subscription.aggregate([
    {
      $match: {
        $or: [
          { subscriber: new mongoose.Types.ObjectId(userId) },
          { channel: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: null,
        subscribers: {
          $sum: {
            $cond: [
              { $eq: ["$channel", new mongoose.Types.ObjectId(userId)] },
              1,
              0,
            ],
          },
        },
        subscribedTo: {
          $sum: {
            $cond: [
              { $eq: ["$subscriber", new mongoose.Types.ObjectId(userId)] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const totalLikesByUser = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        likes: { $sum: 1 },
      },
    },
  ]);

  const response = {
    videoStats,
    channelStats,
    // totalSubscribers,
    // totalChannelsSubscribedTo,
    totalLikesByUser,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Channel Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(400, "Invalid user id");

  const videos = await Video.find({ owner: user._id });
  const totalVideos = videos.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalVideos, videos },
        "Channel Videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
