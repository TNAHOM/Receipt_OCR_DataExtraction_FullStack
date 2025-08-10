import { Router } from "express";
import multer from "multer";
import {receiptUploadFile} from "../controllers/receipt.controller";

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const receiptUpload = multer({ storage: storage });

route.post("/", receiptUpload.single("file"), receiptUploadFile);

export default route;
