import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //comes with nodejs

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;

    //uploading the file
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "youtubeApiClone",
      resource_type: "auto",
    });

    //file has been uploaded
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the temp file from the server if the upload on the cloud failed
    return null;
  }
};

const deleteOnCloudinary = async function (folderName, cloudPath) {
  try {
    // Extracting the filename without extension dynamically
    const fileNameWithoutExtension = cloudPath.match(/\/([^/]+)\.[^/.]+$/)?.[1];

    if (!fileNameWithoutExtension) {
      console.log("Invalid cloudPath provided:", cloudPath);
      return null;
    }

    // Extracting the resource type
    const resourceType = cloudPath.includes("/image/")
      ? "image"
      : cloudPath.includes("/video/")
        ? "video"
        : "auto"; // or any other default resource type

    const fullPublicId = `${folderName}/${fileNameWithoutExtension}`;

    const response = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });

    return response;
  } catch (error) {
    console.log("Error while Deleting cloudinary file: ", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
