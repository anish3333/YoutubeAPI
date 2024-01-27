import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {uploadOnServer} from '../middlewares/multer.middleware.js'

const router = Router();

// before processing the data it is sent through the multer middleware which uploads files on the server
router.route("/register").post(
  uploadOnServer.fields([
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

export default router;