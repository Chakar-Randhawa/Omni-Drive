import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/image-tools/image-metadata-exif-viewer');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
