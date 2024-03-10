import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    const user = await User.findById(req.user._id)

    if (!user) throw new ApiError(404, "the user does not exist");
    if (!videoId) throw new ApiError(404, "incorrect video id");
    if(!content) throw new ApiError(404, "cant post empty comment")

    const newComment = await Comment.create({
        owner: user._id,
        video: videoId,
        content
    })

    return res
    .status(201)
    .json(new ApiResponse(201, newComment, "new comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {updatedContent} = req.body

    if(!commentId) throw new ApiError(404, "comment ID missing");

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: updatedContent },
        { new: true }
    );
    if(!updatedComment) throw new ApiError(404, "Comment Not Found or id is invalid")

    return res //sending the new Comment in response
    .status(201)
    .json(new ApiResponse(201, updatedComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if(!commentId) throw new ApiError(404, "comment ID missing");
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) throw new ApiError(404, "Comment Not Found or id is invalid");

    return res
    .status(201)
    .json(new ApiResponse(201, {}, "comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
