import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL;
    const apiKey = process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY;
    const enableEmailVerification =
      process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION;

    return NextResponse.json({
      authUrl,
      hasApiKey: !!apiKey,
      enableEmailVerification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check auth configuration" },
      { status: 500 }
    );
  }
}
