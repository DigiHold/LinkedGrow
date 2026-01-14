"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, FileText, Scale } from "lucide-react";
import { PrelaunchFooter } from "@/components/prelaunch/prelaunch-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
              </svg>
            </div>
            <span className="text-xl font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white">
              Linked<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Grow</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium mb-4">
            <Scale className="w-4 h-4" />
            Legal Information
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Legal Notice
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Mentions legales - In accordance with Article 6 of Law No. 2004-575 of June 21, 2004 (LCEN)
          </p>
        </div>

        {/* Company Information */}
        <div className="space-y-8">
          {/* Publisher Section */}
          <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Website Publisher</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Company Name</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Vayalis</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">SIREN Number</p>
                  <p className="font-mono text-slate-900 dark:text-white">987 827 649</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">VAT Number (TVA)</p>
                  <p className="font-mono text-slate-900 dark:text-white">FR69987827649</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Registered Address</p>
                    <p className="text-slate-900 dark:text-white">
                      78 Avenue Des Champs-Elysees<br />
                      75008 Paris, France
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Contact Email</p>
                    <a
                      href="mailto:contact@linkedgrow.ai"
                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      contact@linkedgrow.ai
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Publication Director */}
          <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Publication Director</h2>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Nicolas Lecocq - Founder & CEO
            </p>
          </section>

          {/* Hosting Section */}
          <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Website Hosting</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Hosting Provider</p>
                <p className="font-semibold text-slate-900 dark:text-white">Vercel Inc.</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Address</p>
                <p className="text-slate-700 dark:text-slate-300">
                  340 S Lemon Ave #4133<br />
                  Walnut, CA 91789, United States
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Website</p>
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  vercel.com
                </a>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Intellectual Property</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The entire content of this website (texts, images, graphics, logos, icons, software, databases, etc.)
              is the exclusive property of Vayalis or its partners and is protected by French and international
              intellectual property laws. Any reproduction, representation, modification, publication, or adaptation
              of all or part of the elements of the site, regardless of the means or process used, is prohibited
              without prior written authorization from Vayalis.
            </p>
          </section>

          {/* Data Protection */}
          <section className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Personal Data Protection</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              In accordance with the General Data Protection Regulation (GDPR) and the French Data Protection Act
              (Loi Informatique et Libertes), you have the right to access, rectify, delete, and port your personal data,
              as well as the right to object to and limit the processing of your data.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              For more information about how we process your data, please consult our{" "}
              <Link href="/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </section>

          {/* Related Links */}
          <section className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 md:p-8 border border-cyan-200 dark:border-cyan-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Related Legal Documents</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                href="/privacy"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Terms of Service</span>
              </Link>
              <Link
                href="/cookies"
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Cookie Policy</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <PrelaunchFooter />
    </main>
  );
}
