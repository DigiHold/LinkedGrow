import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const DOCS_DIR = path.join(process.cwd(), "src/content/docs");

export interface DocCategory {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon?: string;
  articleCount: number;
}

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  order: number;
  content: string;
}

export interface DocArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  order: number;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

interface CategoryJson {
  title: string;
  description: string;
  order: number;
  icon?: string;
}

function getCategoryData(categorySlug: string): CategoryJson | null {
  const categoryJsonPath = path.join(DOCS_DIR, categorySlug, "_category.json");
  if (!fs.existsSync(categoryJsonPath)) return null;
  const raw = fs.readFileSync(categoryJsonPath, "utf-8");
  return JSON.parse(raw) as CategoryJson;
}

export function getAllCategories(): DocCategory[] {
  if (!fs.existsSync(DOCS_DIR)) return [];

  const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
  const categories: DocCategory[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const catData = getCategoryData(entry.name);
    if (!catData) continue;

    const articleFiles = fs.readdirSync(path.join(DOCS_DIR, entry.name))
      .filter((f) => f.endsWith(".md"));

    categories.push({
      slug: entry.name,
      title: catData.title,
      description: catData.description,
      order: catData.order,
      icon: catData.icon,
      articleCount: articleFiles.length,
    });
  }

  return categories.sort((a, b) => a.order - b.order);
}

export function getArticlesForCategory(categorySlug: string): DocArticleMeta[] {
  const categoryDir = path.join(DOCS_DIR, categorySlug);
  if (!fs.existsSync(categoryDir)) return [];

  const catData = getCategoryData(categorySlug);
  if (!catData) return [];

  const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".md"));
  const articles: DocArticleMeta[] = [];

  for (const file of files) {
    const filePath = path.join(categoryDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    articles.push({
      slug: file.replace(/\.md$/, ""),
      title: data.title || file.replace(/\.md$/, ""),
      description: data.description || "",
      category: categorySlug,
      categoryTitle: catData.title,
      order: data.order || 99,
    });
  }

  return articles.sort((a, b) => a.order - b.order);
}

export async function getArticle(categorySlug: string, articleSlug: string): Promise<DocArticle | null> {
  const filePath = path.join(DOCS_DIR, categorySlug, `${articleSlug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const catData = getCategoryData(categorySlug);
  if (!catData) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content: markdownContent } = matter(raw);

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownContent);

  return {
    slug: articleSlug,
    title: data.title || articleSlug,
    description: data.description || "",
    category: categorySlug,
    categoryTitle: catData.title,
    order: data.order || 99,
    content: result.toString(),
  };
}

export function extractTableOfContents(html: string): TableOfContentsItem[] {
  const headingRegex = /<h([2-3])\s+id="([^"]+)"[^>]*>.*?<a[^>]*>([^<]*)<\/a>.*?<\/h[2-3]>/g;
  const items: TableOfContentsItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    items.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].trim(),
    });
  }

  // Fallback: if autolink wrapping didn't produce expected format, try simpler regex
  if (items.length === 0) {
    const simpleRegex = /<h([2-3])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-3]>/g;
    while ((match = simpleRegex.exec(html)) !== null) {
      const text = match[3].replace(/<[^>]+>/g, "").trim();
      if (text) {
        items.push({
          level: parseInt(match[1]),
          id: match[2],
          text,
        });
      }
    }
  }

  return items;
}

export function getAdjacentArticles(categorySlug: string, articleSlug: string): {
  prev: DocArticleMeta | null;
  next: DocArticleMeta | null;
} {
  const articles = getArticlesForCategory(categorySlug);
  const currentIndex = articles.findIndex((a) => a.slug === articleSlug);

  if (currentIndex === -1) return { prev: null, next: null };

  return {
    prev: currentIndex > 0 ? articles[currentIndex - 1] : null,
    next: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null,
  };
}

export function getAllArticleMetas(): DocArticleMeta[] {
  const categories = getAllCategories();
  const allArticles: DocArticleMeta[] = [];

  for (const cat of categories) {
    const articles = getArticlesForCategory(cat.slug);
    allArticles.push(...articles);
  }

  return allArticles;
}

export function getAllSlugs(): string[][] {
  const categories = getAllCategories();
  const slugs: string[][] = [];

  for (const cat of categories) {
    const articles = getArticlesForCategory(cat.slug);
    for (const article of articles) {
      slugs.push([cat.slug, article.slug]);
    }
  }

  return slugs;
}
