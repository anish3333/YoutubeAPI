import { Router } from "express";
import { 
  loginUser,
  logoutUser,
  registerUser, 
  refreshAccessToken, 
  isUserLoggedIn, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateAccountDetails, 
  updateUserAvatar, 
  updateUserCoverImage, 
  getUserChannelProfile, 
  getWatchHistory 
} from "../controllers/user.controller.js";
import {uploadOnServer} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// before processing the data it is sent through the multer middleware which uploads files on the server
router.route("/register").post(
  uploadOnServer.fields([ //specify which fields to take as files from post request
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/isUserLoggedIn").get(isUserLoggedIn);

router.route("/login").post(loginUser)

//secured routes(needs the user to be logged in)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-current-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)//patch - change some of the details
router.route("/change-avatar").patch(
  verifyJWT,
  uploadOnServer.single("avatar"),
  updateUserAvatar
)
router.route("/change-coverImage").patch(
  verifyJWT,
  uploadOnServer.single("coverImage"),
  updateUserCoverImage
)
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router;