import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, context: { params: { slug: string } }) {
  try {
    const { slug } = context.params;

    // Find the shareable link
    const link = await prisma.shareableLink.findUnique({
      where: { slug },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatar: true,
            walletAddress: true,
            suiNameService: true,
            minDonationAmount: true,
            customMessage: true,
            twitterHandle: true,
            websiteUrl: true
          }
        }
      }
    });

    if (!link || !link.isActive) {
      return NextResponse.json(
        { error: 'Link not found or inactive' }, 
        { status: 404 }
      );
    }

    // Increment click count
    await prisma.shareableLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } }
    });

    // Update analytics (profile views)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        creatorId_date: {
          creatorId: link.creatorId,
          date: today
        }
      },
      update: {
        profileViews: { increment: 1 },
        linkClicks: { increment: 1 }
      },
      create: {
        creatorId: link.creatorId,
        date: today,
        profileViews: 1,
        linkClicks: 1,
        totalPayments: 0,
        totalAmount: 0,
        uniqueDonors: 0,
        averageAmount: 0
      }
    });

    return NextResponse.json({
      link,
      creator: link.creator
    });

  } catch (error) {
    console.error('Get public link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
