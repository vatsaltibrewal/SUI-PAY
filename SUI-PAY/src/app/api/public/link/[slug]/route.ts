import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';

export async function GET(req: NextRequest, context: { params: { slug: string } }) {
  try {
    const { slug } = context.params;

    // Find the shareable link
    const link = await DataStore.findLinkBySlug(slug);

    if (!link || !link.isActive) {
      return NextResponse.json(
        { error: 'Link not found or inactive' }, 
        { status: 404 }
      );
    }

    // Get creator data
    const creator = await DataStore.findCreatorById(link.creatorId);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    // Increment click count
    await DataStore.updateLink(link.id, { 
      clickCount: link.clickCount + 1 
    });

    return NextResponse.json({
      link: {
        ...link,
        clickCount: link.clickCount + 1
      },
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
        websiteUrl: creator.websiteUrl
      }
    });

  } catch (error) {
    console.error('Get public link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
