import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/video-audio-tools/video-to-audio-mp3');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
