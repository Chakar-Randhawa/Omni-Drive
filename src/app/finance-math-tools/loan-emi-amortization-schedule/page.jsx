'use client';

import React from 'react';
import { ToolPageContainer } from '../../../components/ToolPageContainer';
import { getToolByPath } from '../../../config/registry';

export default function Page({ onNavigate }) {
  const tool = getToolByPath('/finance-math-tools/loan-emi-amortization-schedule');
  return <ToolPageContainer tool={tool} onNavigate={onNavigate} />;
}
