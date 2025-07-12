// app/layout.tsx
import { AuthProviderWrapper } from "./(admin)/auth/AuthProviderWrapper";
import { ErrorProvider } from "./(admin)/contexts/ErrorContext";
import "./globals.css";

export const metadata = {
  title: "Your App",
  description: "My description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <body>
          <AuthProviderWrapper>
            <ErrorProvider>
              {children}
            </ErrorProvider>
          </AuthProviderWrapper>
      </body>
    </html>
  );
}
