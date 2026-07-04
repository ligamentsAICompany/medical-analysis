import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css';
import './liga-tokens.css';
import './app-shell.css';
import './premium-ui.css';
import './analysis-v2.css';
import './workspace-theme.css';
import { Providers } from './providers';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'MedDocs — Clinical Intelligence',
  description: 'Upload and analyse medical documents with AI-powered analysis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${plusJakarta.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
