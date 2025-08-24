import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { AuthService } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, walletAddress } = await req.json();

    // Validation - either email or wallet address is required
    if (!email && !walletAddress) {
      return NextResponse.json(
        { error: 'Email or wallet address is required' }, 
        { status: 400 }
      );
    }

    // Find creator by email or wallet address
    let creator = null;
    
    if (email) {
      creator = await DataStore.findCreatorByEmail(email);
    } else if (walletAddress) {
      creator = await DataStore.findCreatorByWallet(walletAddress);
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    // Create session
    const sessionToken = await AuthService.createSession(creator.id, creator.email, creator.username);

    // Return creator data (without sensitive info)
    const { ...creatorData } = creator;

    return NextResponse.json({
      message: 'Login successful',
      creator: creatorData,
      token: sessionToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
