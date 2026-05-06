'use client';

import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { MedDocsProvider } from '../src/context/MedDocsContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MedDocsProvider>{children}</MedDocsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
