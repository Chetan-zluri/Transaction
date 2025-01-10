import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File; // For single file uploads
      files?: Express.Multer.File[]; // For multiple file uploads
    }
  }
}
