'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '../config/registry';

export const Footer = ({ onNavigate }) => {
  const router = useRouter();
  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (path.includes('#')) {
      window.location.href = path;
    } else {
      router.push(path);
    }
  };

  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5B5BD6] flex items-center justify-center text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-base font-extrabold tracking-tight text-[#111827]">
                OMNIDRIVE <span className="text-[#5B5BD6]">TOOLS</span>
              </span>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Fast, privacy-first, browser-native utility suite. 105+ genuine client-side tools across documents, graphics, audio, security, text, and financial calculations.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#12A88A]/10 text-[#12A88A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12A88A]"></span>
                Zero Server Uploads &bull; Client-Side Memory
              </span>
            </div>
          </div>

          {/* Categories 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">
              Document & Media
            </h4>
            <ul className="space-y-2 text-xs text-[#4B5563]">
              <li>
                <button type="button" onClick={() => handleNav('/#pdf-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  PDF & Documents (30 Tools)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/#image-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Image Media (25 Tools)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/#video-audio-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Video & Audio (15 Tools)
                </button>
              </li>
            </ul>
          </div>

          {/* Categories 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">
              Developer & Financial
            </h4>
            <ul className="space-y-2 text-xs text-[#4B5563]">
              <li>
                <button type="button" onClick={() => handleNav('/#security-dev-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Security & Developer (15 Tools)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/#writing-text-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Writing & Text (10 Tools)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/#finance-math-tools')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Finance & Math (10 Tools)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Product Pages */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">
              Legal & Information
            </h4>
            <ul className="space-y-2 text-xs text-[#4B5563]">
              <li>
                <button type="button" onClick={() => handleNav('/about')} className="hover:text-[#5B5BD6] cursor-pointer">
                  About OmniDrive Tools
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/privacy-policy')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/terms-of-service')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('/contact')} className="hover:text-[#5B5BD6] cursor-pointer">
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#EEF0F4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <p>&copy; {new Date().getFullYear()} OmniDrive Tools. All client processing is strictly contained to local browser execution.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#6B7280]">Static Browser Runtime</span>
            <span>&bull;</span>
            <span className="text-[#12A88A] font-medium">Privacy Guaranteed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
