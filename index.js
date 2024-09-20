import express from "express";
import dotenv from "dotenv";
import { uploadOnCloudinary } from "./utils/cloudinary.js"; // Import the function you created
import {
  generateImage,
  generateQuoteFromImage,
  addTextToImage,
} from "./utils/generateQuote.js";
dotenv.config();

const app = express();
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Inspirational Quote Generator!");
});

app.get("/generate-quote-image", async (req, res) => {
  try {
    const imageUrl = await generateImage();
    console.log("Generated image URL:", imageUrl);
    const { quote, subject, message } = await generateQuoteFromImage(imageUrl);
    console.log("Generated quote:", quote);
    const finalImagePath = await addTextToImage(
      imageUrl,
      quote,
      "public/logo_placeholder.svg"
    );
    console.log("Final image path:", finalImagePath);

    const cloudinaryResponse = await uploadOnCloudinary(finalImagePath);

    if (!cloudinaryResponse) {
      return res
        .status(500)
        .json({ error: "Failed to upload image to Cloudinary." });
    }

    res.json({
      quote,
      subject,
      message,
      cloudinaryResponse, // This will return the path to the saved image
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
