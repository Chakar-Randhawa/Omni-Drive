import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/image-tools/image-to-text-ocr');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
