import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { createCanvas, loadImage, registerFont } from "canvas"; // Ensure you have canvas installed
import fs from "fs";

dotenv.config();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an image
const generateImage = async () => {
  try {
    const prompts = [
      "Generate a serene background image featuring a tranquil nature scene, such as a sunset over a calm lake or a misty forest, with no text.",
      "Create an abstract blend of soft pastel colors swirling together, providing a soothing and artistic background, with no text.",
      "Design a minimalist landscape with rolling hills and a clear blue sky, emphasizing simplicity and peace, with no text.",
      "Show a panoramic view of a bustling city skyline at dusk, with twinkling lights starting to glow, creating a vibrant yet peaceful scene, with no text.",
      "Generate a breathtaking view of the night sky filled with stars and a glowing galaxy, creating a sense of wonder and infinity, with no text.",
    ];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const imageResponse = await openai.images.generate({
      prompt,
      n: 1,
      size: "1024x1024",
    });
    return imageResponse.data[0].url;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate an image.");
  }
};

// Generate a quote based on an image
const generateQuoteFromImage = async (imageUrl) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a quote generator. Generate an inspirational quote based on the following image.",
        },
        {
          role: "user",
          content: `![image](${imageUrl})`,
        },
      ],
    });

    const quote = completion.choices[0].message.content;
    return quote;
  } catch (error) {
    console.error("Error generating quote:", error);
    throw new Error("Failed to generate a quote.");
  }
};

// Add text to image
const addTextToImage = async (imageUrl, text, logoPath) => {
  const image = await loadImage(imageUrl);
  const logo = await loadImage(logoPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Create a semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Black overlay with 50% opacity
  ctx.fillRect(0, 0, image.width, image.height); // Full canvas size

  const maxWidth = image.width * 0.9; // 90% of image width
  const fontSize = Math.floor(image.height / 15); // Dynamic font size
  ctx.font = `bold ${fontSize}px Sans`; // Font style
  ctx.fillStyle = "white"; // Text color
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Split text into lines
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine + word + " ";
    const metrics = ctx.measureText(testLine);
    const lineWidth = metrics.width;

    if (lineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word + " ";
    } else {
      currentLine = testLine;
    }
  });

  lines.push(currentLine);

  // Draw each line centered
  const lineHeight = fontSize * 1.2; // Line height
  const totalHeight = lines.length * lineHeight;
  let y = (canvas.height - totalHeight) / 2; // Center vertically

  lines.forEach((line) => {
    ctx.fillText(line.trim(), canvas.width / 2, y);
    y += lineHeight;
  });

  // Draw the logo at the bottom center
  const logoWidth = image.width * 0.2; // Adjust logo size as needed
  const logoHeight = (logo.height / logo.width) * logoWidth; // Maintain aspect ratio
  ctx.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    canvas.height - logoHeight - 20,
    logoWidth,
    logoHeight
  ); // 20px from the bottom

  const buffer = canvas.toBuffer("image/png");
  const outputPath = "output/image-with-quote.png";
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Inspirational Quote Generator!");
});

app.get("/generate-quote-image", async (req, res) => {
  try {
    const imageUrl = await generateImage();
    console.log("Generated image URL:", imageUrl);
    const quote = await generateQuoteFromImage(imageUrl);
    console.log("Generated quote:", quote);
    const finalImagePath = await addTextToImage(
      imageUrl,
      quote,
      "public/logo_placeholder.svg"
    );
    console.log("Final image path:", finalImagePath);

    res.json({
      quote,
      imageUrl: finalImagePath, // This will return the path to the saved image
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
