import type { Metadata } from "next";
import { NewAgentWizard } from "./new-agent-wizard";

export const metadata: Metadata = {
  title: "New agent",
};

export default function NewAgentPage() {
  return <NewAgentWizard />;
}
