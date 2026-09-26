import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/security-dev-tools/regex-tester-visualizer');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
