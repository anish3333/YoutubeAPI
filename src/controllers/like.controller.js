import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    
    if(!req.user){
        throw new ApiError(400, "you need to login to like ")
    }
    const {videoId} = req.params
    const user = await User.findById(req.user._id);
    let like = await Like.find({likedBy: user._id, video: videoId});

    if(!like){ //if the like does not exist
        like = await Like.create({
            user: user._id,
            video: videoId
        })
        return res
        .status(201)
        .json(new ApiResponse(201, like, "Liked the video successfully"));
    }
    
    await Like.deleteOne({likedBy: user._id, video: videoId})
    return res
    .status(201)
    .json(new ApiResponse(201, {}, "Removed the like successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    if(!req.user){
        throw new ApiError(400, "you need to login to like ")
    }

    const liekdVideos = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos", 
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                videos: { $arrayElemAt: ["$videos", 0] } 
            }
        }
    ]);

    return res
    .status(201)
    .json(new ApiResponse(201, liekdVideos, "Removed the like successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}