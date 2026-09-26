'use client';

import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/image-tools/background-remover');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
