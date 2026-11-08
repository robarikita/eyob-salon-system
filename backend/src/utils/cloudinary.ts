import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId?: string;
}

export async function uploadImage(
  input: string | Buffer,
  folder: string = "eyob-services"
): Promise<UploadResult> {
  // If input is already an external HTTP/HTTPS URL, return it directly
  if (typeof input === "string" && (input.startsWith("http://") || input.startsWith("https://"))) {
    return { url: input };
  }

  // If Cloudinary is not configured, fallback gracefully
  if (!isConfigured) {
    logger.warn("Cloudinary not configured; using fallback image handler.");
    if (typeof input === "string") {
      return { url: input };
    }
    const base64 = `data:image/jpeg;base64,${input.toString("base64")}`;
    return { url: base64 };
  }

  try {
    if (Buffer.isBuffer(input)) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              logger.error({ error }, "Cloudinary stream upload error");
              return reject(error || new Error("Failed to upload image stream to Cloudinary"));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );
        stream.end(input);
      });
    } else {
      // Base64 data URI or file path
      const result = await cloudinary.uploader.upload(input, {
        folder,
        resource_type: "image",
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }
  } catch (err) {
    logger.error({ err }, "Cloudinary upload failed");
    if (typeof input === "string") {
      return { url: input };
    }
    return { url: `data:image/jpeg;base64,${input.toString("base64")}` };
  }
}

