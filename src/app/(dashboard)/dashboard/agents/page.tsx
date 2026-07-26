import type { Metadata } from "next";
import { AgentsContent } from "./agents-content";

export const metadata: Metadata = {
  title: "Agents",
};

export default function AgentsPage() {
  return <AgentsContent />;
}
