'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ToolLayout } from './ToolLayout';
const PDFWorkspace = dynamic(() => import('./workspaces/PDFWorkspace').then((m) => m.PDFWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });
const ImageWorkspace = dynamic(() => import('./workspaces/ImageWorkspace').then((m) => m.ImageWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });
const MediaWorkspace = dynamic(() => import('./workspaces/MediaWorkspace').then((m) => m.MediaWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });
const SecurityWorkspace = dynamic(() => import('./workspaces/SecurityWorkspace').then((m) => m.SecurityWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });
const TextWorkspace = dynamic(() => import('./workspaces/TextWorkspace').then((m) => m.TextWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });
const FinanceWorkspace = dynamic(() => import('./workspaces/FinanceWorkspace').then((m) => m.FinanceWorkspace), { ssr: false, loading: () => <div className="p-8 text-center text-sm text-[#6B7280]">Loading tool...</div> });

export const ToolPageContainer = ({ tool, onNavigate }) => {
  if (!tool) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#111827]">Tool Not Found</h2>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-[#5B5BD6] text-white rounded-xl text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const renderWorkspace = () => {
    switch (tool.category) {
      case 'pdf-tools':
        return <PDFWorkspace tool={tool} />;
      case 'image-tools':
        return <ImageWorkspace tool={tool} />;
      case 'video-audio-tools':
        return <MediaWorkspace tool={tool} />;
      case 'security-dev-tools':
        return <SecurityWorkspace tool={tool} />;
      case 'writing-text-tools':
        return <TextWorkspace tool={tool} />;
      case 'finance-math-tools':
        return <FinanceWorkspace tool={tool} />;
      default:
        return <div>Ready to process.</div>;
    }
  };

  const getToolFaqs = () => {
    return [
      {
        q: `Are my files uploaded to a remote server when using ${tool.name}?`,
        a: `No. OmniDrive Tools executes 100% of the ${tool.name} algorithm inside your local browser memory using modern Canvas, Web Crypto, and client-side JavaScript APIs (WebAssembly is used for select tools, such as OCR). Your documents and data never leave your device.`
      },
      {
        q: `Is there a file count or file size limit for ${tool.name}?`,
        a: `There are no arbitrary daily quotas, credits, or account paywalls. File size limits are solely constrained by your device's available browser memory (typically up to 100MB per file).`
      },
      {
        q: `What happens to my data after I close or refresh this tab?`,
        a: `Because no files are uploaded to cloud servers or databases, all temporary buffers and object URLs allocated in your browser tab are immediately purged by the JavaScript garbage collector when you close or refresh the page.`
      },
      {
        q: `Does ${tool.name} work on mobile devices?`,
        a: `Yes. OmniDrive's pages are fully responsive across modern desktop, tablet, and mobile browsers. Most tools work in Chrome, Edge, Firefox, and Safari; a few advanced tools (e.g. some video/audio and QR scanning features) rely on browser APIs with the broadest support in Chrome and Edge.`
      }
    ];
  };

  return (
    <ToolLayout
      tool={tool}
      faqItems={getToolFaqs()}
      onNavigate={onNavigate}
    >
      {renderWorkspace()}
    </ToolLayout>
  );
};
export default ToolPageContainer;
