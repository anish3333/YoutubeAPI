import multer from "multer"

//we are storing files temporarily on our server so the user can change the file if he wants to before submission of data
//if we didnt then as soon as the user selects a file it is directly uploaded on the cloudinary 

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})

export const uploadOnServer = multer({
  storage: storage,
})