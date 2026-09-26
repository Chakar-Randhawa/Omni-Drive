'use client';

import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">Legal Agreement</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
          Terms of Service
        </h1>
        <p className="text-xs text-[#6B7280]">Last Updated: September 2026</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 space-y-6 shadow-xs text-sm sm:text-base text-[#4B5563] leading-relaxed">
        <h2 className="text-lg font-bold text-[#111827]">1. Acceptance of Terms</h2>
        <p>
          By accessing and using OmniDrive Tools ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should discontinue using the Service immediately.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">2. Nature of the Service & User Content</h2>
        <p>
          OmniDrive Tools provides browser-native computational and conversion utilities. Because all conversions occur in your client environment, you retain full ownership and copyright of any materials processed. You are solely responsible for ensuring you have all legal rights and authorizations to process, transform, or modify any files you introduce to the tools.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">3. Financial Calculators Disclaimer</h2>
        <p>
          All financial, loan, compound interest, tax, and investment calculators available on OmniDrive Tools are provided for educational and estimation purposes only. These calculations do not constitute certified financial, tax, or legal advice. Real-world financial figures vary based on lending terms, jurisdictional tax laws, and market conditions. Consult a qualified financial advisor before executing financial commitments.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">4. Developer & Security Utilities Disclaimer</h2>
        <p>
          Tools such as Bcrypt hashing, JWT debugging, and regex testers are provided for software engineering and diagnostic purposes. OmniDrive Tools makes no guarantee that any password entropy score guarantees immunity from brute-force decryption or specialized attack vectors.
        </p>

        <h2 className="text-lg font-bold text-[#111827]">5. Disclaimer of Warranties & Limitation of Liability</h2>
        <p>
          The service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. Under no circumstances shall OmniDrive Tools or its contributors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the tools or resulting files.
        </p>
      </div>
    </div>
  );
}
export { TermsOfServicePage };
