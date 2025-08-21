import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes - in production, use a database
const verificationStore = new Map<string, { attempts: number; verified: boolean }>();

export async function POST(request: NextRequest) {
  try {
    const { email, invitationType } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Check your database for the invitation status
    // 2. Verify if the user has clicked the verification link
    // 3. Check if the invitation has been accepted

    // For now, we'll simulate a verification check
    // You should replace this with your actual verification logic
    
    // Example: Check if the user has verified their email
    const isVerified = await checkEmailVerificationStatus(email, invitationType);

    return NextResponse.json({
      verified: isVerified,
      email,
      invitationType
    });

  } catch (error) {
    console.error('Error checking email verification status:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

// Placeholder function - replace with your actual verification logic
async function checkEmailVerificationStatus(email: string, invitationType: string): Promise<boolean> {
  // This should be replaced with your actual database query
  // Example implementation:
  
  // 1. Check if the invitation exists
  // const invitation = await db.invitations.findOne({ 
  //   email, 
  //   type: invitationType,
  //   status: 'pending'
  // });
  
  // 2. Check if the user has verified their email
  // const user = await db.users.findOne({ email });
  // return user?.emailVerified === true;
  
  console.log(`Checking verification status for ${email} - ${invitationType}`);
  
  // Use in-memory storage instead of localStorage
  const key = `${email}_${invitationType}`;
  const currentStatus = verificationStore.get(key) || { attempts: 0, verified: false };
  
  // For demo purposes, we'll simulate that verification only happens after 5 attempts
  // In real implementation, this would check if the user actually clicked the verification link
  if (currentStatus.attempts >= 5) {
    console.log(`Email ${email} is verified after ${currentStatus.attempts} attempts`);
    currentStatus.verified = true;
    verificationStore.set(key, currentStatus);
    return true;
  }

  // Increment attempts for next check
  currentStatus.attempts += 1;
  verificationStore.set(key, currentStatus);

  console.log(`Email ${email} is not yet verified (attempts: ${currentStatus.attempts})`);
  return false;
}
