'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">About the Platform</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
          Privacy-First Client Utilities for Everyone
        </h1>
        <p className="text-base text-[#4B5563] max-w-2xl mx-auto">
          OmniDrive Tools was engineered to eliminate server file uploads for everyday document, media, security, text, and financial operations.
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 space-y-6 shadow-xs text-sm sm:text-base text-[#4B5563] leading-relaxed">
        <h2 className="text-xl font-bold text-[#111827]">Our Mission & Architectural Philosophy</h2>
        <p>
          Most traditional file conversion portals and utilities require users to upload sensitive personal documents, contracts, identification photos, or proprietary spreadsheets to remote third-party servers. In many cases, users have no visibility into how long those files are retained, who has access to them, or whether they are backed up on insecure remote disks.
        </p>
        <p>
          OmniDrive Tools was designed from the ground up on modern browser computing primitives. By leveraging client-side WebAssembly, standard Canvas pipelines, the HTML5 Web Audio framework, and the Web Crypto API, operations that once required large server farms can now execute instantly and securely directly inside your device&apos;s memory.
        </p>

        <h2 className="text-xl font-bold text-[#111827] pt-4">Core Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4]">
            <h3 className="font-bold text-[#111827] mb-1">100% Client-Side Privacy</h3>
            <p className="text-xs sm:text-sm text-[#667085]">
              Your files never traverse an API or cloud converter. Memory is released immediately after downloading.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4]">
            <h3 className="font-bold text-[#111827] mb-1">No Paywalls & No Accounts</h3>
            <p className="text-xs sm:text-sm text-[#667085]">
              No registration, login, email capture, or recurring subscriptions. All tools are immediately accessible.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4]">
            <h3 className="font-bold text-[#111827] mb-1">Honest Browser Processing</h3>
            <p className="text-xs sm:text-sm text-[#667085]">
              Genuine browser-compatible algorithms with transparent capability detection and zero fake outputs.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4]">
            <h3 className="font-bold text-[#111827] mb-1">Static Architecture</h3>
            <p className="text-xs sm:text-sm text-[#667085]">
              Built to run anywhere with high resilience, minimal latency, and zero server maintenance overhead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export { AboutPage };
