const { processFile } = require("../services/upload.service.js");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Process the uploaded file (e.g., OCR)
    const result = await processFile(req.file.path);

    return res
      .status(200)
      .json({ message: "File processed successfully", data: result });
  } catch (error) {
    console.error("Error processing file:", error);
    return res.status(500).json({ message: "Error processing file" });
  }
};

module.exports = {
  uploadFile,
};
