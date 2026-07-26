import type { Metadata } from "next";
import { HomeContent } from "./home-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <HomeContent />;
}
