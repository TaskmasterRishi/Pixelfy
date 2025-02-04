// cloudinary.js
import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dbcgxsh5x',
  },
});

export const uploadImage = async (imageUri) => {
  const UPLOAD_PRESET = "Default"; // Replace with your actual upload preset

  // Dynamically determine file type
  const fileType = imageUri.split('.').pop();  // Extract file extension
  const mimeType = fileType === "jpg" || fileType === "jpeg" ? "image/jpeg" : `image/${fileType}`;

  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: mimeType,
    name: `upload.${fileType}`,
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

    if (!response.ok) {
      throw new Error("Cloudinary upload failed with status: " + response.status);
    }

    let result = await response.json();
    console.log("Uploaded Image URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    return null; // Return null to indicate failure
  }
};
