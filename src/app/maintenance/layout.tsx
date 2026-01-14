import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance - LinkedGrow",
  description:
    "LinkedGrow is currently undergoing scheduled maintenance. We'll be back shortly with an improved experience.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
