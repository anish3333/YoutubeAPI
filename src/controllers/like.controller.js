import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(400, "you need to login to like ");
  }
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "invalid video id");

  const user = await User.findById(req.user._id);
  const like = await Like.find({ likedBy: user._id, video: videoId });
  console.log(like);
  if (like.length === 0) {
    //if the like does not exist
    const newlike = await Like.create({
      user: user._id,
      video: videoId,
      likedBy: user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newlike, "Liked the video successfully"));
  }

  await Like.deleteOne({ likedBy: user._id, video: videoId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Removed the video like successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400, "invlaid user id ");
  }
  const like = await Like.find({ likedBy: user._id, comment: commentId });

  if (like.length === 0) {
    //if the like does not exist
    const newlike = await Like.create({
      user: user._id,
      comment: commentId,
      likedBy: user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newlike, "Liked the comment successfully"));
  }

  await Like.deleteOne({ likedBy: user._id, comment: commentId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Removed the comment like successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(400, "invlaid user id ");
  }
  const like = await Like.find({ likedBy: user._id, tweet: tweetId });

  if (like.length === 0) {
    //if the like does not exist
    const newlike = await Like.create({
      user: user._id,
      tweet: tweetId,
      likedBy: user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newlike, "Liked the tweet successfully"));
  }

  await Like.deleteOne({ likedBy: user._id, tweet: tweetId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Removed the tweet like successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  if (!req.user) {
    throw new ApiError(400, "you need to login to like ");
  }

  const liekdVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $addFields: {
        video: { $arrayElemAt: ["$video", 0] },
      },
    },
    {
      $project: {
        _id: 0,
        video: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, liekdVideos, "Removed the like successfully"));
});

const getLikedVideosByUserId = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "incorrect user id ");
  }

  const liekdVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $addFields: {
        video: { $arrayElemAt: ["$video", 0] },
      },
    },
    {
      $project: {
        _id: 0,
        video: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(
      new ApiResponse(201, liekdVideos, "fethced the liked videos successfully")
    );
});

const getTotalLikesByAnyId = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const { type } = req.query;
  const {id} = req.params
  
  const matchQuery = {}
  if (type === "video" || type === "comment" || type === "tweet") { //forsafety
    matchQuery[type] = new mongoose.Types.ObjectId(id);
  }
  else{
    throw new ApiError(400, "incorrect type option")
  }

  const likes = await Like.aggregate([
    {
      $match: matchQuery
    },
    {
      $group: {
        "_id" :null,
        totalLikes: {$sum: 1}
      }
    }
  ]);

  return res
    .status(201)
    .json(
      new ApiResponse(201, likes, "fethced the liked videos successfully")
    );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedVideosByUserId,
  getTotalLikesByAnyId,
};
