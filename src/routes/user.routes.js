import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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

router.route("/login").post(loginUser)

//secured routes(needs the user to be logged in)
router.route("/logout").post(verifyJWT, logoutUser)




router.route("/logout")

export default router;