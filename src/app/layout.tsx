import './globals.css';
import '@/styles/styles.css';

import { Metadata } from 'next';
import QueryProvider from '@/components/query-provider';
import StyleProvider from '@/components/style-provider';
import AppCacheProvider from './app-cache-provider';
import AiCredentialsProvider from '@/components/ai-credentials-provider';
import AiUserCredentials from '@/components/ai-user-credentials';

import { metadataConfig } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { roboto } from '@/themes';

export const metadata: Metadata = {
  ...metadataConfig,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(roboto.className)}>
      <body>
        <AppCacheProvider>
          <QueryProvider>
            <StyleProvider>
              <AiCredentialsProvider>
                {children}
                <AiUserCredentials />
              </AiCredentialsProvider>
            </StyleProvider>
          </QueryProvider>
        </AppCacheProvider>
      </body>
    </html>
  );
}
