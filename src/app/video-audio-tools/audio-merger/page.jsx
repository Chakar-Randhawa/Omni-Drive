import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/video-audio-tools/audio-merger');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
