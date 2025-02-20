import { Cloudinary } from "@cloudinary/url-gen";
import * as FileSystem from "expo-file-system";

export const cld = new Cloudinary({
  cloud: {
    cloudName: "dbcgxsh5x", // Your Cloudinary cloud name
  },
});

export const uploadImage = async (imageUri, folder = "") => {
  const UPLOAD_PRESET = "Default"; // Replace with your actual upload preset

  try {
    // Get MIME type using FileSystem
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) throw new Error("File not found");

    const mimeType = fileInfo.uri.endsWith(".jpg") || fileInfo.uri.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";

    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      type: mimeType,
      name: `upload.${mimeType.split("/")[1]}`,
    });
    data.append("upload_preset", UPLOAD_PRESET);
    if (folder) data.append("folder", folder); // Optional folder structure

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dbcgxsh5x/image/upload`, // Use your Cloudinary cloud name
      {
        method: "POST",
        body: data,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Uploaded Image URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    return null;
  }
};

// ✅ New method to upload avatar to 'avatar' folder
export const uploadAvatar = async (imageUri) => {
  return uploadImage(imageUri, "avatar"); // Upload avatar images to 'avatar' folder
};

export const deleteImage = async (publicId) => {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: YOUR_API_KEY,
          timestamp: Math.floor(Date.now() / 1000),
          signature: generateSignature(publicId), // Generate signature using your secret
        }),
      }
    );

    const data = await response.json();
    return data.result === "ok";
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};