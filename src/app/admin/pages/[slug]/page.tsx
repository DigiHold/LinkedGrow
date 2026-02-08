import { getPageBySlug } from "@/lib/cms";
import { notFound } from "next/navigation";
import { PageEditor } from "./editor-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const page = await getPageBySlug(decodedSlug);
  if (!page) {
    notFound();
  }

  return <PageEditor page={page} />;
}
