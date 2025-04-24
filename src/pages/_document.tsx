import * as React from 'react';
import { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import {
  DocumentHeadTags,
  documentGetInitialProps,
} from '@mui/material-nextjs/v15-pagesRouter';
import { cn } from '@/lib/utils';
import { roboto } from '@/themes';

export default function MyDocument(props: any) {
  return (
    <Html lang="en" className={cn(roboto.className)}>
      <Head>
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
