// cloudinary.js
import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
});

export const uploadImage = async (imageUri) => {
  const UPLOAD_PRESET = "Default"; // Replace with your actual upload preset

  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg", // Adjust based on file type
    name: "upload.jpg",
  });
  data.append("upload_preset", UPLOAD_PRESET);

  try {
    let response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    let result = await response.json();
    console.log("Uploaded Image URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
  }
};
