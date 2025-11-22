// src/routes/cloudinary.route.ts
import { Router, Request, Response } from "express";
import { cloudinary } from "../../config/cloudinary";

const router = Router();

interface CloudinarySignQuery {
  folder?: string;
  uploadPreset?: string;
  // thêm các param khác nếu muốn
}

/**
 * GET /api/cloudinary/signature
 * Client gọi để lấy signature, timestamp, apiKey, cloudName
 *
 * Có thể nhận thêm:
 *  - folder
 *  - uploadPreset (nếu bạn dùng upload_preset dạng signed)
 */
router.get(
  "/signature",
  (
    req: Request<unknown, unknown, unknown, CloudinarySignQuery>,
    res: Response
  ) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);

      // Lấy các param optional từ query (nếu cần)
      const { folder, uploadPreset } = req.query;

      // Các tham số sẽ được ký – phải trùng với những gì client dùng khi upload
      const paramsToSign: Record<string, any> = {
        timestamp,
      };

      if (folder) {
        paramsToSign.folder = folder;
      }

      // Nếu bạn dùng upload_preset dạng signed
      if (uploadPreset) {
        paramsToSign.upload_preset = uploadPreset;
      }

      const apiSecret = cloudinary.config().api_secret;
      if (!apiSecret) {
        throw new Error("Cloudinary api_secret missing in config");
      }

      // Tạo signature (SHA-1)
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        apiSecret
      );

      return res.json({
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        timestamp,
        signature,
        // trả lại để client dùng đúng:
        folder: folder || undefined,
        uploadPreset: uploadPreset || undefined,
      });
    } catch (error) {
      console.error("[Cloudinary Signature Error]:", error);
      return res.status(500).json({
        error: "Cannot generate Cloudinary signature",
      });
    }
  }
);

export default router;
