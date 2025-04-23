import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export interface AppCacheProviderProps {
  children: React.ReactNode;
}

export default function AppCacheProvider({ children }: AppCacheProviderProps) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
      {children}
    </AppRouterCacheProvider>
  );
}
