import { Request, Response } from "express";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../models/systemSettings.model";
import { sendSuccess, sendError } from "../../utils/response";

// GET /admin/system

export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const config = await getSystemSettings();
    return sendSuccess(res, config);
  } catch (error: any) {
    console.error("Get System Config Error:", error);
    return sendError(res, 500, "Lỗi server lấy cấu hình", error?.message);
  }
};

// PUT /admin/system

export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const updatedConfig = await updateSystemSettings(payload);

    return sendSuccess(res, updatedConfig);
  } catch (error: any) {
    console.error("Update System Config Error:", error);
    return sendError(res, 500, "Lỗi server cập nhật cấu hình", error?.message);
  }
};
