import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // not using query
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid page or limit parameters."));
  }
  // try {
    const match = { owner: req.user._id };
    const sort = {};

    if (sortBy && sortType) {
      sort[sortBy] = sortType === "desc" ? -1 : 1;
    }

    const options = {
      page: parsedPage,
      limit: parsedLimit,
      sort: sort,
    };

    const result = await Video.aggregatePaginate(match, options);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));

  // } catch (error) {
  //   return res
  //     .status(500)
  //     .json(new ApiResponse(500, null, "Internal server error"));
  // }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const videoFileLocalPath = req.files?.videoFile[0]?.path;

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail file is required"); //as avatar is required
  if (!videoFileLocalPath) throw new ApiError(400, "video file is required"); //as avatar is required

  const thumbailOnCloud = await uploadOnCloudinary(thumbnailLocalPath);
  const videoOnCloud = await uploadOnCloudinary(videoFileLocalPath);

  const video = await Video.create({
    title,
    description,
    videoFile: videoOnCloud?.url || "",
    thumbnail: thumbailOnCloud?.url || "",
    duration: videoOnCloud.duration || 0,
    views: 0,
    isPublished: true,
    owner: req.user._id,
  });

  if (!video)
    throw new ApiError(500, "something went wrong while uploading the video");
  return res
    .status(201)
    .json(new ApiResponse(201, video, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //   const video = await Video.findById(videoId);

  //   if (!video) {
  //     throw new ApiError(404, "Video not found");
  //   }
  //   video.views += 1;
  //   await video.save();
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true } // Return the updated document
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId)

  const isVideoDeleted = await deleteOnCloudinary("youtubeApiClone", video.videoFile)
  const isThumbNailDeleted = await deleteOnCloudinary("youtubeApiClone", video.thumbnail)

  if(!isVideoDeleted){
    throw new ApiError(400, "video didnt get deleted froms the cloud")
  }
  if(!isThumbNailDeleted){
    throw new ApiError(400, "thumbnail didnt get deleted froms the cloud")
  }
  
  const result = await Video.findByIdAndDelete(videoId);

  if (!result) {
    throw new ApiError(400, "Error occurred while deleting video.");
  }

  res.status(201).json(new ApiResponse(200, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found || video id invalid");
    }
    video.isPublished = !video.isPublished;
    await video.save()

//   const video = await Video.findByIdAndUpdate(
//     videoId,
//     { $set: { isPublished: { $not: ["$isPublished"] } } },
//     { new: true } 
//   );

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }
  return res
    .status(201)
    .json(new ApiResponse(201, video, "isPublished toggled successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
