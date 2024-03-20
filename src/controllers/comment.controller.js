import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (
      isNaN(parsedPage) ||
      isNaN(parsedLimit) ||
      parsedPage < 1 ||
      parsedLimit < 1
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid page or limit parameters."));
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $skip: skip, //number of elements to skip
      },
      {
        $limit: parsedLimit, //number of elements to include
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner"
        }
      },
      {
        $addFields:{
          owner: {
            $first: "$owner"
          }
        }
      },
      {
        $project: {
          "owner.password": 0,
          "owner.refreshToken": 0,
          "owner.createdAt": 0,
          "owner.updatedAt": 0,
          "owner.__v": 0
        }
      }
      
    ]);

    if (comments.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, comments, "No comments for this video"));
    }

    // comments
    //   .populate("owner")
    //   .select("-password -refreshToken -createdAt -updatedAt");

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully."));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error."));
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError(404, "the user does not exist");
  if (!videoId) throw new ApiError(404, "incorrect video id");
  if (!content) throw new ApiError(404, "cant post empty comment");

  const newComment = await Comment.create({
    owner: user._id,
    video: videoId,
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "new comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) throw new ApiError(404, "comment ID missing");

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );
  if (!updatedComment)
    throw new ApiError(404, "Comment Not Found or id is invalid");

  return res //sending the new Comment in response
    .status(201)
    .json(new ApiResponse(201, updatedComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(400, "comment ID missing");
  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment)
    throw new ApiError(404, "Comment Not Found or id is invalid");

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
