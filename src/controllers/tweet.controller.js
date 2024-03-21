import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content of the tweet is required");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  if (!tweet) {
    throw new ApiError(500, "tweet was not created");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(400, "Invalid user ID");

  //const tweets = await Tweet.find({owner: user._id});
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
  ]);
  return res
    .status(201)
    .json(new ApiResponse(201, tweets, "Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!tweetId) {
    throw new ApiError(400, "Tweet Id is required");
  }
  if (!content) {
    throw new ApiError(400, "provide new content to update the tweet");
  }
  
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Id is invalid");
  }
  tweet.content = content;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet Id is required");
  }
  const result = await Tweet.findByIdAndDelete(tweetId);
  
  if (!result)
    throw new ApiError(404, "Comment Not Found or id is invalid");

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
