'use client';

import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/finance-math-tools/adsense-estimated-revenue-calculator');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
