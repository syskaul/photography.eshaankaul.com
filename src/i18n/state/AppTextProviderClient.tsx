'use client';

import { ReactNode } from 'react';
import { AppTextContext } from './client';
import { I18N } from '..';
import { generateAppTextState } from '.';
import MixpanelProvider from '@/analytics/MixpanelProvider';
import WebsiteAnalytics from '@/analytics/WebsiteAnalytics';

export default function AppTextProviderClient({
  children,
  value,
}: {
  children: ReactNode
  value: I18N
}) {
  return (
    <AppTextContext.Provider value={generateAppTextState(value)}>
      <MixpanelProvider>
        <WebsiteAnalytics />
        {children}
      </MixpanelProvider>
    </AppTextContext.Provider>
  );
}
