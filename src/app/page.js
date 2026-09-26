'use client';

import React, { useState } from 'react';
import { Icon } from '../components/Icons';
import { CATEGORIES, TOOLS } from '../config/registry';
import { AdSenseSlot } from '../components/AdSenseSlot';

export default function HomePage({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredTools = TOOLS.filter(tool => {
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesQuery = !searchFilter || 
      tool.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (tool.keywords || []).some(k => k.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleToolClick = (e, path) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <div className="w-full space-y-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-2xs text-xs font-semibold text-[#111827] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#12A88A] animate-pulse"></span>
          105+ Pure Browser Utilities &bull; Zero Server Uploads
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight leading-[1.1] mb-6">
          Every tool you need. <br className="hidden sm:inline" />
          <span className="text-[#5B5BD6]">100% processed in your browser.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#4B5563] leading-relaxed mb-8">
          Compress, merge, convert, edit, and calculate without exposing your personal documents or data to remote servers. No logins, no file caps, no subscriptions.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto relative mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search 105+ tools (e.g. merge pdf, resize image, jwt, loan emi)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base bg-white border-2 border-[#E5E7EB] hover:border-[#5B5BD6]/50 focus:border-[#5B5BD6] rounded-2xl text-[#111827] shadow-xs outline-none transition-all"
            />
            <Icon name="search" className="w-5 h-5 text-[#9CA3AF] absolute left-4 top-4.5" />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-4 top-4.5 text-xs text-[#9CA3AF] hover:text-[#111827] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#5B5BD6]/40'
            }`}
          >
            All 105 Tools
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-[#5B5BD6] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#5B5BD6]/40'
              }`}
            >
              <Icon name={cat.icon} className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
              {selectedCategory === 'all' ? 'All Browser Utilities' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Showing {filteredTools.length} production tools ready for local execution
            </p>
          </div>
          <span className="text-xs font-mono text-[#5B5BD6] bg-[#5B5BD6]/10 px-2.5 py-1 rounded-full font-semibold">
            {filteredTools.length} / 105
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <a
              key={tool.id}
              href={tool.path}
              onClick={(e) => handleToolClick(e, tool.path)}
              className="bg-white border border-[#E5E7EB] hover:border-[#5B5BD6]/50 rounded-2xl p-5 text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4] group-hover:border-[#5B5BD6]/30 group-hover:bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center transition-colors">
                  <Icon name={tool.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#5B5BD6] transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-[#6B7280] line-clamp-2 mt-1 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF0F4] flex items-center justify-between text-[11px] text-[#9CA3AF]">
                <span className="uppercase font-mono font-medium text-[#6B7280]">
                  {tool.output}
                </span>
                <span className="font-semibold text-[#5B5BD6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open &rarr;
                </span>
              </div>
            </a>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] p-8">
            <Icon name="search" className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-base font-bold text-[#111827]">No matching tools found</p>
            <p className="text-xs text-[#6B7280] mt-1">Try searching for keywords like "pdf", "image", "hash", or "calculator".</p>
          </div>
        )}
      </section>

      {/* AdSense Slot */}
      <AdSenseSlot />

      {/* Why OmniDrive Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">The Modern Standard</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1">
            Why Choose Pure Browser Processing?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-[#111827] text-base">Zero Data Exposure</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Standard file tools upload your files to remote cloud storage. OmniDrive runs the algorithmic parsing exclusively in local browser RAM.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#12A88A]/10 text-[#12A88A] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-[#111827] text-base">Instantaneous Processing</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Skip multi-megabyte network upload waits. Files are sliced, converted, or analyzed immediately by your CPU and WebAssembly engine.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-[#111827] text-base">No Subscription Trap</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Every tool is unlimited and genuinely free. No credit counts, trial expiries, paywalls, or forced account registrations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
export { HomePage };
