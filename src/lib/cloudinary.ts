import { Cloudinary } from "@cloudinary/url-gen";
import * as FileSystem from "expo-file-system";
import * as Crypto from 'expo-crypto';

// Directly write the credentials but keep them as constants
const CLOUD_NAME = "dbcgxsh5x";
const API_KEY = "862634424731423";
const API_SECRET = "W79r47BOrJx7s7ccKN-1O93nc8U";

// Export only what's necessary
export const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    apiSecret: API_SECRET
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
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
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

export const deleteImage = async (publicId: string) => {
  try {
    console.log('Deleting image with public ID:', publicId); // Debug log

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateSignature(publicId, timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dbcgxsh5x/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: '862634424731423',
          timestamp,
          signature,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to delete image: ${text}`);
    }

    const result = await response.json();
    console.log('Delete result:', result); // Debug log
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

// Helper function to generate the signature
const generateSignature = async (publicId: string, timestamp: number) => {
  const str = `public_id=${publicId}&timestamp=${timestamp}W79r47BOrJx7s7ccKN-1O93nc8U`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    str
  );
  return hash;
};