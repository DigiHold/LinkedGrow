---
day: 6
title: "Generating LinkedIn Carousels as Multi-Page PDFs With Puppeteer"
description: "LinkedIn renders carousels from PDF documents, one page per slide. Here is the pipeline for going from HTML templates to a clean PDF that LinkedIn accepts on first try."
tags:
  - puppeteer
  - pdf
  - nodejs
  - webdev
---

LinkedIn carousels are not images. They are PDFs, one page per slide, uploaded as a document attachment to the share. LinkedIn's renderer turns each page into a swipeable slide on the feed. This is one of those things that took me three failed uploads to figure out, because the documentation says "carousel" and your mind says "image sequence."

Once you know it is a PDF, the pipeline is straightforward. Render HTML templates to PDF with Puppeteer, upload the PDF to LinkedIn as a document, attach to a share. Here is the working setup.

## The HTML template approach

Each slide is a 1080x1350 HTML page. I render them with React on the server, write the HTML to disk, then point Puppeteer at it.

The slide template:

```tsx
function Slide({ index, total, title, body }: SlideProps) {
  return (
    <html>
      <head>
        <style>{`
          @page { size: 1080px 1350px; margin: 0; }
          html, body { margin: 0; padding: 0; width: 1080px; height: 1350px; }
          .slide {
            width: 1080px; height: 1350px;
            display: flex; flex-direction: column;
            padding: 80px;
            font-family: Inter, system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <div className="slide">
          <h2 style={{ fontSize: 56, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 28, marginTop: 32 }}>{body}</p>
          <div style={{ marginTop: "auto", fontSize: 18, opacity: 0.5 }}>
            {index + 1} / {total}
          </div>
        </div>
      </body>
    </html>
  );
}
```

The `@page` rule is the part that keeps biting people. PDF page size is set in CSS, not in Puppeteer. Set it once per page, omit margins, and your output matches the slide dimensions exactly.

## The Puppeteer call

Render each slide's HTML to a separate PDF, then concatenate. This is more reliable than rendering one giant multi-page document because Puppeteer handles single-page renders cleanly and concatenation is fast.

```ts
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

async function renderCarousel(slides: SlideHtml[]): Promise<Uint8Array> {
  const browser = await puppeteer.launch({ headless: true });
  const pdfBuffers: Uint8Array[] = [];

  for (const slideHtml of slides) {
    const page = await browser.newPage();
    await page.setContent(slideHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      width: "1080px",
      height: "1350px",
      printBackground: true,
      preferCSSPageSize: true,
    });
    pdfBuffers.push(pdf);
    await page.close();
  }

  await browser.close();

  // Concatenate into a single PDF
  const merged = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    const single = await PDFDocument.load(buf);
    const [copied] = await merged.copyPages(single, [0]);
    merged.addPage(copied);
  }

  return merged.save();
}
```

`preferCSSPageSize: true` is what makes the `@page` size in your HTML actually apply. Without it, Puppeteer falls back to its default A4 and you get a tiny 1080px image floating in a giant page.

`printBackground: true` is the difference between "your background colors render" and "your slides come out white because Puppeteer skips background paints by default."

`waitUntil: "networkidle0"` matters if your slides load fonts or images. Skip it and you race the loader.

## Hosting Puppeteer on Vercel

Puppeteer ships with a bundled Chromium. The bundle is roughly 170MB, which exceeds Vercel's serverless function size limit. You have three options:

1. **Use `@sparticuz/chromium`**, which is a slimmed Chromium specifically for serverless. Combined with `puppeteer-core`, the function fits under the 50MB limit on Vercel.
2. **Run the rendering on a separate machine** (a small Fly.io or Render container) and call it from Vercel.
3. **Use a managed PDF API** like Browserless or PDFShift.

I went with option 1 for cost, option 2 for reliability when traffic gets uneven. Both work. Option 3 is fastest to set up and the most expensive at scale.

Setup with `@sparticuz/chromium`:

```ts
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

## Uploading to LinkedIn

Once you have the PDF, the upload flow is similar to images. POST to `/rest/documents?action=initializeUpload`, PUT the PDF bytes to the returned upload URL, attach the document URN to your share.

```ts
const init = await fetch(
  "https://api.linkedin.com/rest/documents?action=initializeUpload",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "LinkedIn-Version": "202401",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  }
);
const { value } = await init.json();

await fetch(value.uploadUrl, { method: "PUT", body: pdfBytes });

// Attach value.document URN to your UGC share's media field
```

LinkedIn caps document size at 100MB and 300 pages. For carousels, you will usually be in the 1-5MB and 5-15 page range, so the cap rarely matters.

## What the user sees

The PDF you upload becomes a swipeable carousel in the feed. Each page is one slide. LinkedIn's renderer adds the page count overlay automatically, but I include my own `1/N` indicator at the bottom of each slide because the LinkedIn one is positioned poorly on mobile.

Once the upload pipeline is in place, generating 10-slide carousels takes about 4-6 seconds end to end. Most of that is Puppeteer cold start. Subsequent runs in the same warm function drop to 2-3 seconds.

The whole thing is one of those "nobody told me it was a PDF" gotchas. Once you know, the implementation is shorter than the figuring-out.
