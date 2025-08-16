// app/layout.tsx
import { AuthProviderWrapper } from "./(admin)/auth/AuthProviderWrapper";
import { ErrorProvider } from "./(admin)/contexts/ErrorContext";
import { ErrorBoundary } from "./(admin)/components/ui/ErrorBoundary";
import { ProtectedRoute } from "./(admin)/auth/ProtectedRoute";
import "./globals.css";
import React from "react";

export const metadata = {
  title: "Your App",
  description: "My description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProviderWrapper>
            <ErrorProvider>
              <ProtectedRoute>
                {children}
              </ProtectedRoute>
            </ErrorProvider>
          </AuthProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
