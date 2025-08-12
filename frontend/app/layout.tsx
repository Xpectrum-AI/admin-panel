// app/layout.tsx
import { AuthProviderWrapper } from "./(admin)/auth/AuthProviderWrapper";
import { ErrorProvider } from "./(admin)/contexts/ErrorContext";
import { ErrorBoundary } from "./(admin)/components/ui/ErrorBoundary";
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
              {children}             
            </ErrorProvider>
          </AuthProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
