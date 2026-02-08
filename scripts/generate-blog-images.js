const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = 'REMOVED';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function generateNanaBananaImage(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  if (!response.candidates || !response.candidates[0]) {
    throw new Error('No candidates in response');
  }

  const candidate = response.candidates[0];
  if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
    throw new Error(`Image blocked: ${candidate.finishReason}`);
  }

  if (!candidate.content || !candidate.content.parts) {
    throw new Error('No content parts in response');
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('No image data found in response');
}

async function compressToAVIF(imageBuffer, outputPath, width, height) {
  let pipeline = sharp(imageBuffer);

  if (width && height) {
    pipeline = pipeline.resize(width, height, { fit: 'cover', position: 'center' });
  }

  await pipeline
    .avif({ quality: 60, effort: 9, chromaSubsampling: '4:4:4' })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  return (stats.size / 1024).toFixed(2);
}

async function main() {
  const promptsPath = path.join(__dirname, '..', 'public', 'images', 'blog', 'linkedin-hooks-guide', 'image-prompts.json');
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'blog', 'linkedin-hooks-guide');
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

  // Generate featured image (native 1K resolution)
  console.log('\n📸 Generating Featured Image...');
  try {
    const buffer = await generateNanaBananaImage(prompts.featured.prompt);
    const size = await compressToAVIF(buffer, path.join(outputDir, prompts.featured.filename), null, null);
    console.log(`✅ ${prompts.featured.filename} (${size}KB)`);
  } catch (err) {
    console.error(`❌ Featured image failed: ${err.message}`);
  }

  // Generate section images (resized to 1020x660)
  for (const section of prompts.sections) {
    console.log(`\n📸 Generating: ${section.filename}...`);
    try {
      const buffer = await generateNanaBananaImage(section.prompt);
      const size = await compressToAVIF(buffer, path.join(outputDir, section.filename), 1020, 660);
      console.log(`✅ ${section.filename} (${size}KB)`);
    } catch (err) {
      console.error(`❌ ${section.filename} failed: ${err.message}`);
    }
  }

  const totalImages = 1 + prompts.sections.length;
  console.log(`\n✅ Done! Generated ${totalImages} images. Cost: $${(0.134 * totalImages).toFixed(2)}`);
}

main().catch(console.error);
