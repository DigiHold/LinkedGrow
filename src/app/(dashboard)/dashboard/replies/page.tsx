import type { Metadata } from "next";
import { RepliesContent } from "./replies-content";

export const metadata: Metadata = { title: "Replies" };

export default function RepliesPage() {
  return <RepliesContent />;
}
