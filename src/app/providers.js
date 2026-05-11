'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { MedDocsProvider } from '../context/MedDocsContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MedDocsProvider>{children}</MedDocsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
