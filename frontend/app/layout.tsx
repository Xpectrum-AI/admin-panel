// app/layout.tsx
import { AuthProviderWrapper } from "./auth/AuthProviderWrapper";
import "./globals.css"; // if you're importing styles

export const metadata = {
  title: "Your App",
  description: "My description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
