'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from './Icons';
import { AdSenseSlot } from './AdSenseSlot';
import { CATEGORIES, TOOLS } from '../config/registry';

export const ToolLayout = ({
  tool,
  children,
  educationalContent,
  faqItems = [],
  relatedToolIds = [],
  onNavigate
}) => {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const category = CATEGORIES.find(c => c.id === tool.category) || {
    name: 'Utilities',
    color: '#5B5BD6'
  };

  // Find related tools
  const relatedTools = (relatedToolIds.length > 0
    ? TOOLS.filter(t => relatedToolIds.includes(t.id))
    : TOOLS.filter(t => t.category === tool.category && t.id !== tool.id)
  ).slice(0, 4);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleNav = (e, path) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (path.includes('#')) {
      window.location.href = path;
    } else {
      router.push(path);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Top Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <nav className="flex items-center text-xs font-medium text-[#6B7280] space-x-2">
          <Link
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="hover:text-[#5B5BD6] cursor-pointer"
          >
            Home
          </Link>
          <span>/</span>
          <a
            href={`/#${tool.category}`}
            onClick={(e) => handleNav(e, `/#${tool.category}`)}
            className="hover:text-[#5B5BD6] cursor-pointer"
          >
            {category.name}
          </a>
          <span>/</span>
          <span className="text-[#111827] font-semibold">{tool.name}</span>
        </nav>
      </div>

      {/* Tool Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs text-[#5B5BD6] mb-4">
          <Icon name={tool.icon} className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight mb-3">
          {tool.name}
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4B5563] leading-relaxed mb-4">
          {tool.desc}
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#12A88A]/10 text-[#12A88A] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12A88A]"></span>
            Browser-Native &bull; No Uploads
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#4B5563] font-medium">
            Format: {tool.output.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#4B5563] font-medium">
            Free & Unlimited
          </span>
        </div>
      </div>

      {/* Primary Workspace (Top-Half) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
          {children}
        </div>
      </main>

      {/* AdSense Slot (Non-obtrusive separation) */}
      <AdSenseSlot />

      {/* Educational & Explanatory Content (Bottom-Half) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Core Educational Guide */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111827] pb-3 border-b border-[#EEF0F4]">
            How {tool.name} Works in OmniDrive
          </h2>
          <div className="text-sm text-[#4B5563] leading-relaxed space-y-4">
            {educationalContent || (
              <>
                <p>
                  The OmniDrive <strong>{tool.name}</strong> operates completely inside your client web browser. Utilizing modern Canvas rendering pipelines and the browser&apos;s native memory architecture (with WebAssembly for select tools), your files never leave your device.
                </p>
                <h3 className="text-base font-semibold text-[#111827] pt-2">Why Client-Side Privacy Matters</h3>
                <p>
                  Traditional web converters transmit sensitive contracts, financial spreadsheets, personal photos, and proprietary documents over public internet connections to remote cloud servers. With OmniDrive, processing happens locally in temporary RAM, guaranteeing complete confidentiality and eliminating waiting in remote server conversion queues.
                </p>
                <h3 className="text-base font-semibold text-[#111827] pt-2">Usage Steps</h3>
                <ol className="list-decimal list-inside space-y-1.5 pl-2">
                  <li>Select or drag your files directly into the workspace above.</li>
                  <li>Adjust any parameters or options to match your exact output requirements.</li>
                  <li>Click the primary action button to execute the transformation instantaneously.</li>
                  <li>Preview your completed output and click Download to save the resulting file.</li>
                </ol>
              </>
            )}
          </div>
        </div>

        {/* FAQ Accordion */}
        {faqItems.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-[#111827] mb-2">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-[#EEF0F4]">
              {faqItems.map((item, idx) => (
                <div key={idx} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold text-[#111827] hover:text-[#5B5BD6] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <Icon
                      name={openFaqIndex === idx ? "x" : "arrow-right"}
                      className={`w-4 h-4 text-[#9CA3AF] transition-transform ${openFaqIndex === idx ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {openFaqIndex === idx && (
                    <p className="mt-2 text-xs sm:text-sm text-[#4B5563] leading-relaxed pr-4">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#111827]">
              Related {category.name} Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedTools.map((relTool) => (
                <a
                  key={relTool.id}
                  href={relTool.path}
                  onClick={(e) => handleNav(e, relTool.path)}
                  className="bg-white border border-[#E5E7EB] hover:border-[#5B5BD6]/50 rounded-2xl p-4 text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon name={relTool.icon} className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#5B5BD6] transition-colors">
                      {relTool.name}
                    </h4>
                    <p className="text-xs text-[#6B7280] line-clamp-2">
                      {relTool.desc}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-[#5B5BD6]">
                    Launch Tool &rarr;
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
export default ToolLayout;
