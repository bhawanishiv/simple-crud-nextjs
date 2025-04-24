import React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';

import StyleProvider from '@/components/style-provider';
import QueryProvider from '@/components/query-provider';

import { metadataConfig } from '@/lib/constant';

import '@/styles/globals.css';
import '@/styles/styles.css';
import { EmotionCache } from '@emotion/cache';

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache; // Replace with the correct type for your emotion cache
}

export default function MyApp(props: MyAppProps) {
  const { Component, pageProps } = props;

  return (
    <AppCacheProvider {...props}>
      <Head>
        <title>{metadataConfig.title?.toString() || 'App'}</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta name="description" content={metadataConfig.description || ''} />
      </Head>

      <QueryProvider>
        <StyleProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Component {...pageProps} />
          </LocalizationProvider>
        </StyleProvider>
      </QueryProvider>
    </AppCacheProvider>
  );
}

MyApp.getInitialProps = async (context: any) => {
  const { Component, ctx } = context;

  return {
    pageProps: {
      // https://nextjs.org/docs/advanced-features/custom-app#caveats
      // ...(await App.getInitialProps(context)).pageProps,
      ...(Component.getInitialProps
        ? await Component.getInitialProps(ctx)
        : {}),
      // Some custom thing for all pages
      pathname: ctx.pathname,
    },
  };
};
