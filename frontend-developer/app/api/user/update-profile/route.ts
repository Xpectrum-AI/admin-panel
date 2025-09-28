import { NextRequest, NextResponse } from "next/server";
import { initBaseAuth } from "@propelauth/node";

const auth = initBaseAuth({
  authUrl: process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL!,
  apiKey: process.env.NEXT_PUBLIC_DEVELOPEMNT_PROPELAUTH_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, firstName, lastName } = body;

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Verify the user token
    const user = await auth.validateAccessTokenAndGetUser(authHeader);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Update user metadata with username and other details
    await auth.updateUserMetadata(user.userId, {
      username,
      firstName,
      lastName,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
