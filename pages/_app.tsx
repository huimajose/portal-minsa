import type { AppProps } from 'next/app';
import { PortalProvider } from '../src/context/PortalContext';
import '../src/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PortalProvider>
      <Component {...pageProps} />
    </PortalProvider>
  );
}
