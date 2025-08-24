import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { AuthService } from '@/lib/auth';
import { SuiNameService } from '@/lib/sui';

export async function POST(req: NextRequest) {
  try {
    const { 
      email, 
      username, 
      displayName, 
      walletAddress, 
      suiNameService,
      bio,
      avatar 
    } = await req.json();

    // Validation
    if (!email || !username || !displayName || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate SUI address format (lenient for development)
    if (!walletAddress || walletAddress.length < 10) {
      return NextResponse.json(
        { error: 'Invalid wallet address' }, 
        { status: 400 }
      );
    }

    // Check if creator already exists
    const [existingByEmail, existingByUsername, existingByWallet] = await Promise.all([
      DataStore.findCreatorByEmail(email),
      DataStore.findCreatorByUsername(username.toLowerCase()),
      DataStore.findCreatorByWallet(walletAddress)
    ]);

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'Creator with this email already exists' }, 
        { status: 409 }
      );
    }

    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Creator with this username already exists' }, 
        { status: 409 }
      );
    }

    if (existingByWallet) {
      return NextResponse.json(
        { error: 'Creator with this wallet address already exists' }, 
        { status: 409 }
      );
    }

    // Validate SUI NS if provided
    if (suiNameService) {
      const resolvedAddress = await SuiNameService.resolveName(suiNameService);
      if (resolvedAddress && resolvedAddress !== walletAddress) {
        return NextResponse.json(
          { error: 'SUI Name Service does not resolve to provided wallet address' }, 
          { status: 400 }
        );
      }
    }

    // Create new creator
    const creator = await DataStore.createCreator({
      email,
      username: username.toLowerCase(),
      displayName,
      walletAddress,
      suiNameService: suiNameService?.toLowerCase(),
      bio,
      avatar,
      isVerified: false,
      minDonationAmount: 1.0
    });

    // Create session
    const sessionToken = await AuthService.createSession(creator.id, creator.email, creator.username);

    // Return creator data (without sensitive info)
    const { ...creatorData } = creator;

    return NextResponse.json({
      message: 'Creator registered successfully',
      creator: creatorData,
      token: sessionToken
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
