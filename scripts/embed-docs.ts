// Generates vector embeddings for all documentation articles
// Run: npx tsx scripts/embed-docs.ts
// Requires OPENAI_API_KEY in .env.local

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DOCS_DIR = path.join(process.cwd(), "src/content/docs");
const OUTPUT_FILE = path.join(process.cwd(), "src/content/docs-embeddings.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 400; // tokens (approx 1 token = 4 chars)
const CHUNK_OVERLAP = 50;

interface DocChunk {
  id: string;
  category: string;
  categoryTitle: string;
  articleSlug: string;
  articleTitle: string;
  content: string;
  embedding: number[];
}

interface CategoryJson {
  title: string;
  description: string;
  order: number;
}

function getCategoryTitle(categorySlug: string): string {
  const categoryJsonPath = path.join(DOCS_DIR, categorySlug, "_category.json");
  if (!fs.existsSync(categoryJsonPath)) return categorySlug;
  const raw = fs.readFileSync(categoryJsonPath, "utf-8");
  const data = JSON.parse(raw) as CategoryJson;
  return data.title;
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const wordsPerChunk = Math.floor(chunkSize * 0.75); // rough token-to-word ratio
  const overlapWords = Math.floor(overlap * 0.75);

  for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
    const chunk = words.slice(i, i + wordsPerChunk).join(" ");
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }
    if (i + wordsPerChunk >= words.length) break;
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not found in environment");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);
}

async function main() {
  console.log("Starting docs embedding generation...\n");

  if (!fs.existsSync(DOCS_DIR)) {
    console.error("Docs directory not found:", DOCS_DIR);
    process.exit(1);
  }

  const categories = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  const allChunks: Omit<DocChunk, "embedding">[] = [];

  for (const catEntry of categories) {
    const categorySlug = catEntry.name;
    const categoryTitle = getCategoryTitle(categorySlug);
    const categoryDir = path.join(DOCS_DIR, categorySlug);
    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const articleSlug = file.replace(/\.md$/, "");
      const articleTitle = data.title || articleSlug;

      // Prepend title and description for better retrieval
      const fullContent = `# ${articleTitle}\n${data.description ? `${data.description}\n\n` : ""}${content}`;
      const chunks = chunkText(fullContent, CHUNK_SIZE, CHUNK_OVERLAP);

      for (let i = 0; i < chunks.length; i++) {
        allChunks.push({
          id: `${categorySlug}/${articleSlug}#${i}`,
          category: categorySlug,
          categoryTitle,
          articleSlug,
          articleTitle,
          content: chunks[i],
        });
      }
    }
  }

  console.log(`Found ${allChunks.length} chunks from ${categories.length} categories\n`);

  // Embed in batches of 50 (OpenAI limit is 2048 per request)
  const batchSize = 50;
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);
    console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allChunks.length / batchSize)} (${texts.length} chunks)...`);
    const batchEmbeddings = await getEmbeddings(texts);
    embeddings.push(...batchEmbeddings);
  }

  const result: DocChunk[] = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result));

  const fileSizeMB = (fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(2);
  console.log(`\nDone! Generated ${result.length} embeddings`);
  console.log(`Output: ${OUTPUT_FILE} (${fileSizeMB} MB)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
