const express = require("express");
const route = express.Router();
const { uploadFile } = require("../controllers/upload.controller");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post("", upload.single("file"), uploadFile);

module.exports = route;
