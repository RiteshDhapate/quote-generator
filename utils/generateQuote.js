import OpenAI from "openai";
import { createCanvas, loadImage } from "canvas"; // Ensure you have canvas installed
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an image
export const generateImage = async () => {
  try {
    const prompts = [
      // Optimized nature/urban scene prompts:
      "Create a peaceful background image of nature, like a sunset casting warm light over a calm lake or a misty forest, with no text.",
      "Render a panoramic view of a lively city skyline at dusk, with lights gradually illuminating the scene, exuding vibrant tranquility, with no text.",
      "Depict a stunning night sky full of sparkling stars and a glowing galaxy, evoking a feeling of boundless wonder, with no text.",

      // New non-nature prompts:
      "Generate a futuristic cityscape with towering skyscrapers, flying vehicles, and neon lights reflecting off smooth metallic surfaces, with no text.",
      "Show an abstract background with vibrant colors and geometric shapes interlocking and flowing together, creating a dynamic and energetic feel, with no text.",
      "Create an ancient, mystical temple ruin with towering stone columns and intricate carvings, bathed in the soft glow of moonlight, with no text.",
      "Generate a high-tech lab interior with glowing holograms, sleek workstations, and a sense of advanced technology, with no text.",
      "Show a cozy coffee shop interior on a rainy day, with soft, warm lighting and raindrops trickling down the window, with no text.",
      "Render a bustling market scene from a distant future, with exotic stalls, colorful goods, and crowds of people from various worlds, with no text.",
      "Create a minimalist interior design with clean lines, modern furniture, and natural light pouring through large windows, with no text.",
      "Generate a retro 80s-inspired background with neon grids, bold gradients, and futuristic landscapes, reminiscent of classic sci-fi aesthetics, with no text.",
      "Show an elegant ballroom with chandeliers hanging from the ceiling, polished floors reflecting golden light, and the sense of a grand event, with no text.",
      "Depict a tranquil library with rows of bookshelves, soft armchairs, and sunlight filtering in through large windows, evoking a sense of calm and knowledge, with no text.",
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
export const generateQuoteFromImage = async () => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a quote generator. Generate an inspirational quote. Then, based on this quote, generate a subject and a message. Return the response in valid JSON format with the following structure:
{
  "quote": "string",
  "subject": "string",
  "message": "string"
},
Do not add any placeholder text or additional commentary. Only return the JSON.`,
        },
      ],
    });

    console.log("Completion", completion.choices[0].message.content);

    const quoteData = completion.choices[0].message.content;

    // const message = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages: [
    //     {
    //       role: "system",
    //       content: `Generate a subject and message based on this ${quote}, Do not add placeholder text. The response should be in json format.`,
    //     },
    //   ],
    // });

    return JSON.parse(quoteData);
  } catch (error) {
    console.error("Error generating quote:", error);
    throw new Error("Failed to generate a quote.");
  }
};

// Add text to image
export const addTextToImage = async (imageUrl, text, logoPath) => {
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
  const logoWidth = image.width * 0.25; // Adjust logo size as needed
  const logoHeight = (logo.height / logo.width) * logoWidth; // Maintain aspect ratio
  ctx.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    canvas.height - logoHeight - 40,
    logoWidth,
    logoHeight
  ); // 20px from the bottom

  const buffer = canvas.toBuffer("image/png");
  const outputPath = "output/image-with-quote.png";
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
};
