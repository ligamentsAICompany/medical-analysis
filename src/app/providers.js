'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { MedDocsProvider } from '../context/MedDocsContext';
import { AssistantProvider } from '../context/AssistantContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MedDocsProvider>
          <AssistantProvider>{children}</AssistantProvider>
        </MedDocsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
