# Quote Generator

The project includes a simple Express server to generate quote images on request.

## Route

- GET /generate-quote-image: Generates an image, creates a quote, adds the quote to the image, and uploads it to Cloudinary.

```javascript
app.get("/generate-quote-image", async (req, res) => {
  // Implementation details as shown above
});
```

# Functions

## Image Generation Functions

### `generateImage()`

Generates a random image based on predefined prompts.

**Returns:** `Promise<string>` - The URL of the generated image.

### `generateQuoteFromImage(imageUrl)`

Generates an inspirational quote based on the provided image URL.

**Parameters:**

- `imageUrl` - The URL of the image to generate a quote from.

**Returns:** `Promise<string>` - The generated quote.

### `addTextToImage(imageUrl, text, logoPath)`

Adds text and a logo to the specified image, saving the result as a new image.

**Parameters:**

- `imageUrl` - The URL of the image.
- `text` - The text to overlay on the image.
- `logoPath` - The path to the logo image.

**Returns:** `Promise<string>` - The path of the saved image with the text and logo.

## Cloudinary Functions

### `uploadOnCloudinary(localFilePath)`

Uploads an image to Cloudinary.

**Parameters:**

- `localFilePath` - The path to the local image file.

**Returns:** `Promise<object | null>` - The Cloudinary response containing image details, or null on failure.

### `deleteOnCloudinary(publicId)`

Deletes an image from Cloudinary.

**Parameters:**

- `publicId` - The public ID of the image to delete.

**Returns:** `Promise<object>` - The Cloudinary response.

## Environment Variables

```plaintext
OPENAI_API_KEY: Your OpenAI API key.
CLOUD_NAME: Your Cloudinary cloud name.
CLOUD_API_KEY: Your Cloudinary API key.
CLOUD_API_SECRET: Your Cloudinary API secret.
```
