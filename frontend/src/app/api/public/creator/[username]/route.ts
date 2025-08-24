import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, context: { params: { username: string } }) {
  try {
    const { username } = context.params;

    // Find creator by username
    const creator = await prisma.creator.findUnique({
      where: { username: username.toLowerCase() },
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
        websiteUrl: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            payments: true,
          }
        }
      }
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    // Get recent payments (public, non-anonymous only)
    const recentPayments = await prisma.payment.findMany({
      where: {
        creatorId: creator.id,
        isAnonymous: false
      },
      select: {
        id: true,
        amount: true,
        message: true,
        donorName: true,
        timestamp: true
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    // Get total stats
    const stats = await prisma.payment.aggregate({
      where: { creatorId: creator.id },
      _sum: { amount: true },
      _count: true
    });

    // Update profile view analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        creatorId_date: {
          creatorId: creator.id,
          date: today
        }
      },
      update: {
        profileViews: { increment: 1 }
      },
      create: {
        creatorId: creator.id,
        date: today,
        profileViews: 1,
        linkClicks: 0,
        totalPayments: 0,
        totalAmount: 0,
        uniqueDonors: 0,
        averageAmount: 0
      }
    });

    return NextResponse.json({
      creator,
      recentPayments,
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalPayments: stats._count
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
