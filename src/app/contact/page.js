'use client';

import React, { useState } from 'react';

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('Feedback');

  const contactEmail = 'support@omnidrive.tools';

  const handleSendEmail = (e) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(`[OmniDrive ${topic}] ${subject}`)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">Support & Feedback</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">
          Contact & Community
        </h1>
        <p className="text-base text-[#4B5563]">
          Have feedback, a tool bug report, or a request for a new browser-based utility?
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="p-4 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4] text-xs sm:text-sm text-[#4B5563] space-y-2">
          <p className="font-semibold text-[#111827]">Direct Email Client Support</p>
          <p>
            Because OmniDrive Tools operates with zero backend servers, messages submitted below launch your device&apos;s native email client to send inquiries directly without intermediary database logging.
          </p>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#5B5BD6] focus:border-transparent outline-none"
            >
              <option value="Bug Report">Bug Report (Browser Compatibility)</option>
              <option value="Tool Request">New Tool Request</option>
              <option value="Feedback">General Feedback</option>
              <option value="Partnership">Partnership & Inquiries</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your inquiry..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#5B5BD6] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
              Message Details
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your browser version, the tool you were using, and details of your request..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:ring-2 focus:ring-[#5B5BD6] focus:border-transparent outline-none resize-y"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-[#5B5BD6] hover:bg-[#4949B8] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Open in Email Client &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}
export { ContactPage };
