import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"

const generateBothTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generarting the access and refesh tokens",
      [error]
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*
  1. get user details from frontend
  2. Validation
  3. check if user already exists(using email, username)
  4. check for images and avatar(required)
  5. if available then upload on cloudinary 
  6. create user object
  7. create entry in db
  8. remove password and refresh token from response
  9. check for user creation
  10. send res
  */

  const { fullname, email, username, password } = req.body;

  // .some will return true if even one of the element satisfies the condition inside

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //searching for one document in the db which has either the same email or the same username
  //{username} means there is a variable 'username' of each doc in the db , same for {email}

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) throw new ApiError(409, "user with email already exists");

  // sent from the multer middleware
  const avatarLocalPath = req.files?.avatar[0]?.path; //avatar[0] gives an object which contains path variable
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required"); //as avatar is required

  const avatarOnCloud = await uploadOnCloudinary(avatarLocalPath);
  const coverImageOnCloud = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarOnCloud)
    throw new ApiError(400, "Avatar was not uploaded on the cloudinary");

  const user = await User.create({
    fullname,
    avatar: avatarOnCloud.url,
    coverImage: coverImageOnCloud?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // we are checking if the user was created and instructing to not send password and refreshToken along with other fields in the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "something went wrong while registering the user");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
  1. req.body se username or email , password
  2. validate if empty or not, find user,
  3. validate if pass correct or not
  4. generate tokens
  5. send cookies and res
  */

  const { email, username, password } = req.body;
  if (!username && !email)
    throw new ApiError(400, "either email or username is required");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "the user does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateBothTokens(user._id);

  // these options disables the user to modify the cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // to avoid sesitive info in the response
  //this is not affecting the db
  delete user.password;
  delete user.refreshToken;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  /*
  1. delete the cookies
  2. reset the refresToken field of the user from the db
  */

  //req.user was created by the auth middleware
  await User.findByIdAndUpdate(
    req.user._id, 
    {
      $unset: {
        refreshToken: 1,
      }
    },
    { // this causes the return of the updated value
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler( async(req, res)=>{
  /*
  //this path should be used when access token has been expired
  1. we will get the refresh token from the cookies 
  2. match it from the db
  3. if it is correct then regenerate the access token and refresh token
  */

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken) throw new ApiError(401, "unauthorized Request");

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id);
    if(!user)  throw new ApiError(401, "Invalid refresh token");


    if(user?.refreshToken !== incomingRefreshToken) throw new ApiError(401, "Refresh token is expired or used");
  
  
    const { accessToken, newRefreshToken } = await generateBothTokens(user._id);
  
    // these options disables the user to modify the cookies
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access and refresh tokens regenerated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }

})

const changeCurrentPassword = asyncHandler( async(req, res) => {
  const {oldPassword, newPassword} = req.body;

  //req.user contains the json data and we cant control the user itself from it
  const user = await User.findById(req.user?._id);
  // console.log("User: ", user);
  // console.log("req.user: ", req.user);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) throw new ApiError(400, "Incorrect old Password")

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(
    new ApiResponse(200, {}, "Password changed successfully")
  )
})

const getCurrentUser = asyncHandler(async(req, res) => {
  const user = req.user; //from auth middleware

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Current User fetched successfully")
  )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullname, email} = req.body;

  if(!fullname || !email) {
    throw new ApiError(400, "All fields are required")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email
      }
    },
    { new: true }
  ).select("-password -refreshToken")


  return res
  .status(200)
  .json(
    new ApiResponse(200, updatedUser, "Account details updated successsfully")
  )
})

// we have to add multer middleware here as well
const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath) throw new ApiError(400, "Avatar file is missing")
  
  // todo: deleting the  old image on updating the cloud
  
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar) throw new ApiError(400, "file didnt get uploaded on the cloud")

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password -refreshToken")


  // delete the old avatar after uploading the new one
  if(!deleteOnCloudinary("youtubeApiClone", req.user.avatar)){
    throw new ApiError(400, "old file didnt get deleted froms the cloud")
  }

  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath) throw new ApiError(400, "cover Image file is missing")
 
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage) throw new ApiError(400, "file didnt get uploaded on the cloud")

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url 
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  // delete the old coverImage after uploading the new one

  if(!deleteOnCloudinary("youtubeApiClone", req.user.coverImage)){
    throw new ApiError(400, "old file didnt get deleted froms the cloud")
  }

  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover Image image updated successfully")
    )
})

const isUserLoggedIn = asyncHandler(async(req, res)=>{
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  
    if(!token) throw new ApiError(401, "No Access token found")
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    if(!user) throw new ApiError(404, "Invalid Access token");
  
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "User was already logged in as the access token existed"
      )
    );

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params

  if(!username?.trim()) throw new ApiError(400, "username is missing");

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions", // Subscription -> subscriptions
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions", // Subscription -> subscriptions
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      }
    }
  ])

  console.log(channel)
  if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User Channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      } 
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",//rewriting the watchHistory field
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner:{//overwriting existing field which contains an array due the above lookup
                $first: "$owner"//first element of the owner array
              }
            }
          }
        ]
      }
    }   
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "watch History fetched successfully")
  )
})



export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  isUserLoggedIn,
  getUserChannelProfile,
  getWatchHistory
};
