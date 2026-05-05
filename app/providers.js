'use client';

import { MedDocsProvider } from '../src/context/MedDocsContext';

export function Providers({ children }) {
  return <MedDocsProvider>{children}</MedDocsProvider>;
}
