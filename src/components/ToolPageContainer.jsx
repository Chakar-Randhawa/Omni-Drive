'use client';

import React from 'react';
import { ToolLayout } from './ToolLayout';
import { PDFWorkspace } from './workspaces/PDFWorkspace';
import { ImageWorkspace } from './workspaces/ImageWorkspace';
import { MediaWorkspace } from './workspaces/MediaWorkspace';
import { SecurityWorkspace } from './workspaces/SecurityWorkspace';
import { TextWorkspace } from './workspaces/TextWorkspace';
import { FinanceWorkspace } from './workspaces/FinanceWorkspace';

export const ToolPageContainer = ({ tool, onNavigate }) => {
  if (!tool) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#111827]">Tool Not Found</h2>
        <a
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-[#5B5BD6] text-white rounded-xl text-sm"
        >
          Return to Dashboard
        </a>
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
        a: `No. OmniDrive Tools executes 100% of the ${tool.name} algorithm inside your local browser memory using modern WebAssembly, Canvas, and client-side JavaScript APIs. Your documents and data never leave your device.`
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
        a: `Yes. All OmniDrive utilities are fully responsive and engineered to work across modern desktop, tablet, and mobile browsers including Safari, Chrome, Edge, and Firefox.`
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
