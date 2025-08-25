import { NextRequest, NextResponse } from 'next/server';
import { DataStore, UniversalStorage, Creator } from '@/lib/storage';

export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;

    // Find creator by username
    let creator = await DataStore.findCreatorByUsername(username.toLowerCase());
    
    // If not found by username, try finding by the identifier pattern
    if (!creator) {
      // Try to find by partial username matching
      const creators = UniversalStorage.get<Creator>('sui-pay-creators');
      creator = creators.find(c => {
        const userIdentifier = c.username?.replace("@", "").replace(".suins", "") || 
                             c.walletAddress?.slice(2, 10) || 
                             c.id;
        return userIdentifier === username;
      }) || null;
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    // Get payments data
    const { payments } = await DataStore.getCreatorPayments(creator.id, { limit: 5 });
    
    // Filter for public, non-anonymous payments only
    const recentPayments = payments
      .filter(payment => !payment.isAnonymous)
      .map(payment => ({
        id: payment.id,
        amount: payment.amount,
        message: payment.message,
        donorName: payment.donorName,
        timestamp: payment.timestamp
      }));

    // Get total stats
    const allPayments = await DataStore.getCreatorPayments(creator.id);
    const totalAmount = allPayments.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = allPayments.payments.length;

    return NextResponse.json({
      creator: {
        id: creator.id,
        username: creator.username,
        displayName: creator.displayName,
        bio: creator.bio,
        avatar: creator.avatar,
        walletAddress: creator.walletAddress,
        suiNameService: creator.suiNameService,
        minDonationAmount: creator.minDonationAmount,
        customMessage: creator.customMessage,
        twitterHandle: creator.twitterHandle,
        websiteUrl: creator.websiteUrl,
        isVerified: creator.isVerified,
        createdAt: creator.createdAt,
      },
      recentPayments,
      stats: {
        totalAmount,
        totalPayments
      }
    });

  } catch (error) {
    console.error('Get public creator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
