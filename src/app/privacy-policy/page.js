'use client';

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">Legal & Privacy</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#6B7280]">Last Updated: September 2026</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 space-y-6 shadow-xs text-sm sm:text-base text-[#4B5563] leading-relaxed">
        <h2 className="text-lg font-bold text-[#111827]">1. Zero File Retention & Local Execution</h2>
        <p>
          OmniDrive Tools operates on a client-first, privacy-by-design model. When you open, merge, compress, edit, decode, or convert files using our utilities, all file read operations and data transformations take place strictly inside your local browser memory (RAM) via standard Web APIs, Canvas, and JavaScript. Your files are never uploaded, transmitted, copied, or stored on our servers.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">2. Sensitive Passwords, Keys, & Text Inputs</h2>
        <p>
          For developer and security utilities—including password entropy evaluation, Bcrypt hashing, checksum calculation, and JWT token debugging—all inputs remain local to your browser session. Passwords and cryptographic seeds are never logged, never cached in persistent databases, and never transmitted across the network.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">3. Advertising & Cookies</h2>
        <p>
          To maintain OmniDrive Tools as a 100% free resource without requiring paid memberships, we may display non-intrusive advertisements served through third-party advertising partners, including Google AdSense. Third-party advertising vendors may use cookies, web beacons, or similar tracking mechanisms to serve advertisements based on a user&apos;s prior visits to this or other websites. You may manage cookie preferences via your web browser settings or through regional consent preference mechanisms.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">4. Web Analytics</h2>
        <p>
          We may gather anonymous, aggregated website traffic telemetry (such as page view counts, browser type, and general geographic country) solely for performance diagnostics and site optimization. No personally identifiable information (PII) or uploaded file content is ever linked to telemetry.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">5. Data Security & Browser Hygiene</h2>
        <p>
          Because file data is held in temporary memory allocated to your active browser tab, closing the browser tab or refreshing the page immediately releases all temporary file buffers and object URLs.
        </p>
      </div>
    </div>
  );
}
export { PrivacyPolicyPage };
