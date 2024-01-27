import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler( async(req, res) => {
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

  const {fullname, email, username, password} = req.body //if data is given from json or form

  // this .some will return true if even one of the element satisfies the condition inside
  if([fullname, email, username, password].some((field) => field?.trim() === "")){
    throw new ApiError(400, "All fields are required")
  }
  
  //searching for one document in the db which has either the same email or the same username
  //{username} means there is a variable 'username' of each doc in the db , same for {email}
  const existingUser = User.findOne({
    $or: [ {username}, {email} ]
  })

  if(existingUser) throw new ApiError(409, "user with email already exists")

  req.files && console.log(req.files)

  // sent from the multer middleware
  const avatarLocalPath = req.files?.avatar[0]?.path //avatar[0] gives an object which contains path variable
  const coverImageLocalPath =req.files?.coverImage[0]?.path

  if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required") //as avatar is required

  const avatarOnCloud = await uploadOnCloudinary(avatarLocalPath)
  const coverImageOnCloud = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatarOnCloud) throw new ApiError(400, "Avatar was not uploade on the cloudinary")

  const user = await User.create({
    fullname,
    avatar: avatarOnCloud.url,
    coverImage: coverImageOnCloud?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  // we are checking if the user was created and instructing to not send password and refreshToken along with other fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if(!createdUser) throw new ApiError(500, "something went wrong while registering the user")
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  )
})

export {registerUser}