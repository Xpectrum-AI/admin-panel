import { AuthProvider } from "@propelauth/nextjs/client";

export default async function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <AuthProvider authUrl={process.env.NEXT_PUBLIC_AUTH_URL!}>
                <body>{children}</body>
            </AuthProvider>
        </html>
    )
}
