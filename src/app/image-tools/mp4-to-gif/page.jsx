import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/image-tools/mp4-to-gif');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
