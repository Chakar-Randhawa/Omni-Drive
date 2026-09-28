'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icons';
import { useSearch } from '../context/SearchContext';
import { CATEGORIES } from '../config/registry';

export const Navbar = ({ currentPath = '/', onNavigate }) => {
  const router = useRouter();
  const { searchQuery, setSearchQuery, searchResults, isSearchOpen, setIsSearchOpen } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const handleSelectTool = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else if (path.includes('#')) {
      // Hash links (category anchors) need a real navigation since the
      // target section lives on a different page than the current one.
      window.location.href = path;
    } else {
      router.push(path);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) handleSelectTool(selected.path);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F7F8FC]/90 backdrop-blur-md border-b border-[#E5E7EB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => handleSelectTool('/')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#5B5BD6] flex items-center justify-center text-white shadow-xs group-hover:bg-[#4949B8] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#111827] flex items-center gap-1.5">
                OMNIDRIVE
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#12A88A]/10 text-[#12A88A]">
                  TOOLS
                </span>
              </span>
            </div>
          </button>

          {/* Search Bar - Center Desktop */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search 105+ tools (e.g. merge pdf, compress, jwt)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setSelectedIndex(0);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-14 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B5BD6] focus:border-transparent transition-all shadow-2xs"
              />
              <Icon name="search" className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
              <div className="absolute right-2.5 top-2 hidden sm:flex items-center gap-0.5">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Quick Search Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-1.5">
                  {searchResults.map((tool, idx) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool.path)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm cursor-pointer transition-colors ${
                        idx === selectedIndex ? 'bg-[#5B5BD6]/10 text-[#5B5BD6]' : 'hover:bg-[#F7F8FC] text-[#111827]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center shrink-0">
                          <Icon name={tool.icon} className="w-3.5 h-3.5 text-[#5B5BD6]" />
                        </div>
                        <span className="font-medium truncate">{tool.name}</span>
                      </div>
                      <span className="text-[11px] text-[#6B7280] px-1.5 py-0.5 rounded bg-[#F3F4F6]">
                        {tool.output.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Categories & Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#4B5563]">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectTool(`/#${cat.id}`)}
                  className="px-3 py-1.5 rounded-lg hover:text-[#5B5BD6] hover:bg-white cursor-pointer transition-colors"
                >
                  {cat.name.split('&')[0].trim()}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#4B5563] hover:text-[#111827] hover:bg-white border border-transparent hover:border-[#E5E7EB] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Icon name={mobileMenuOpen ? "x" : "settings"} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E7EB] py-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl text-[#111827]"
              />
              <Icon name="search" className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
            </div>

            {searchQuery && searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleSelectTool(tool.path)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left hover:bg-white"
                  >
                    <Icon name={tool.icon} className="w-4 h-4 text-[#5B5BD6]" />
                    <span className="font-medium text-[#111827]">{tool.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EEF0F4]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectTool(`/#${cat.id}`)}
                  className="p-2 text-left text-xs font-semibold text-[#4B5563] hover:text-[#5B5BD6] hover:bg-white rounded-lg"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
