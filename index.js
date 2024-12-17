const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// File Upload Endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    // Read file as a buffer
    const dataBuffer = fs.readFileSync(file.path);

    // Parse PDF content
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Extracting DBD and Downpayment with their values using regex
    const matches = {};
    const regex = /(DBD|Downpayment)[^\d]*([\d,.]+)/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches[match[1].toUpperCase()] = match[2].trim();
    }

    // res.json({
    //   text: data.text,
    //   info: data.info,
    // });
    res.json({
      extractedValues: matches,
      fullText: text, // Optional: include full text for debugging
    });
  } catch (err) {
    console.error("Error processing PDF: ", err);
    res.status(500).send({ err: "Error processing PDF file" });
  } finally {
    // Cleanup: Delete uploaded file after processing
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file: ", err);
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
