import { DocsFooter } from "@/components/docs/docs-footer";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {children}
      <DocsFooter />
    </div>
  );
}
