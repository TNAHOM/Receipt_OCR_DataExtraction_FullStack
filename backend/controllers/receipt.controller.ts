import { Request, Response } from "express";
import type { Multer } from "multer";
import {processFile} from "../services/upload.service";

interface MulterRequest extends Request {
  file?: Express.Multer.File | (Multer extends infer _T ? any : never); 
}

export const receiptUploadFile = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const result = await processFile(req.file.path);
    return res.status(200).json({
      message: "File processed & saved successfully",
      data: result,
    });
  } catch (error: any) {
    const rawMessage = error?.message || 'Unexpected server error while processing receipt.';
    console.error("Error processing or saving receipt:", rawMessage, error);
    return res.status(500).json({
      message: "Failed to process and persist receipt",
      error: rawMessage,
    });
  }
};