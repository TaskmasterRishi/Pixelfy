import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dbcgxsh5x', // Your Cloudinary cloud name
  },
});

export const uploadImage = async (imageUri, folder = "") => {
  const UPLOAD_PRESET = "Default"; // Replace with your actual upload preset

  // Determine file type dynamically
  const fileType = imageUri.split('.').pop();
  const mimeType = fileType === "jpg" || fileType === "jpeg" ? "image/jpeg" : `image/${fileType}`;

  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: mimeType,
    name: `upload.${fileType}`,
  });
  data.append("upload_preset", UPLOAD_PRESET);
  data.append("folder", folder); // Upload inside the specified folder

  try {
    let response = await fetch(
      `https://api.cloudinary.com/v1_1/dbcgxsh5x/image/upload`, // Use your Cloudinary cloud name
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
    return null;
  }
};

// ✅ New method to upload avatar to 'avatar' folder
export const uploadAvatar = async (imageUri) => {
  return uploadImage(imageUri, "avatar"); // Upload avatar images to 'avatar' folder
};
