import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(
      400,
      "Name and description of the playlist are required"
    );
  }
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const playlist = await Playlist.create({
    name,
    description,
    videos: [],
    owner: user._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "playlist created  successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userPlaylists = await Playlist.find({ owner: userId }).populate("videos");

  if (!userPlaylists || userPlaylists.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No playlists found for the user."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlists fetched successfully.")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId).populate("videos");
  if (!playlist) throw new ApiError(400, "Invalid playlist id");
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(400, "Invalid video ID");
  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video added successfully."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  await Playlist.updateOne({ _id: playlistId }, { $pull: { videos: videoId } });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Removed successfully."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // const result = await Playlist.deleteOne({ _id: playlistId });
  const result = await Playlist.findByIdAndDelete(playlistId);
  /*
  result -> {
    result: true,
    deletedCount: 1,
    n: 1,
    ok: 1
  };
  */
  if (!result || result.deletedCount === undefined) {
    throw new ApiError(400, "Error occurred while deleting playlist.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name && !description) {
    throw new ApiError(400, "Please provide at least one field to update.");
  }

  const playlist = await Playlist.findById(playlistId);

  if (name) {
    playlist.name = name;
  }

  if (description) {
    playlist.description = description;
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist details updated successfully."));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
