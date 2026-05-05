import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'MedDocs — Medical Document Manager',
  description: 'Upload and analyse medical documents with AI-powered analysis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
