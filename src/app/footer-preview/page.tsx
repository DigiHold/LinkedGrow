"use client";

import { useState } from "react";
import {
  FooterVariant1,
  FooterVariant2,
  FooterVariant3,
  FooterVariant4,
  FooterVariant5,
} from "@/components/marketing/footer";

const variants = [
  { id: 1, name: "Newsletter Banner", description: "Gradient banner at top with email capture" },
  { id: 2, name: "Minimal Centered", description: "Clean centered layout" },
  { id: 3, name: "Dark Gradient", description: "Bold dark theme with gradients" },
  { id: 4, name: "Card Style", description: "Floating card email capture" },
  { id: 5, name: "Split Layout", description: "Email left, links right" },
];

export default function FooterPreviewPage() {
  const [activeVariant, setActiveVariant] = useState(1);

  const renderFooter = () => {
    switch (activeVariant) {
      case 1:
        return <FooterVariant1 />;
      case 2:
        return <FooterVariant2 />;
      case 3:
        return <FooterVariant3 />;
      case 4:
        return <FooterVariant4 />;
      case 5:
        return <FooterVariant5 />;
      default:
        return <FooterVariant1 />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sticky Variant Selector */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Footer Variants Preview
          </h1>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setActiveVariant(variant.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeVariant === variant.id
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <span className="font-bold">#{variant.id}</span> {variant.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Currently viewing: <span className="font-semibold text-cyan-600 dark:text-cyan-400">Variant {activeVariant}</span> - {variants.find(v => v.id === activeVariant)?.description}
          </p>
        </div>
      </div>

      {/* Footer Preview */}
      <div className="pt-8">
        {renderFooter()}
      </div>

      {/* Instructions */}
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          To use a variant on the live site:
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Edit <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-sm">src/components/marketing/footer.tsx</code>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Change <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-sm">ACTIVE_VARIANT</code> to <span className="font-bold text-cyan-600">{activeVariant}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
