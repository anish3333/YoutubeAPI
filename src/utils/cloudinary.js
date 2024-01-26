import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //comes with nodejs

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function(localFilePath) {
  try {
    if(!localFilePath) return null

    //uploading the file
    const response = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto"
      }
    )
    
    //file has been uploaded
    console.log("file has been uploaded on clodinary ", response.url);
    
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath) //remove the temp file from the server if the upload on the cloud failed
    return null;
  }
}

export {uploadOnCloudinary}
