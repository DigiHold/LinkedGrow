import type { Metadata } from "next";
import { AgentDetailContent } from "./agent-detail-content";

export const metadata: Metadata = {
  title: "Agent",
};

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentDetailContent agentId={id} />;
}
