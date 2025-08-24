import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { AuthService } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Create a demo creator
    const demoCreator = await DataStore.createCreator({
      email: 'demo@suipay.com',
      username: 'demo',
      displayName: 'Demo Creator',
      bio: 'This is a demo creator account showcasing SuiPay features!',
      avatar: undefined,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      suiNameService: '@demo.suins',
      isVerified: true,
      twitterHandle: '@democreator',
      websiteUrl: 'https://democreator.com',
      minDonationAmount: 1.0,
      customMessage: 'Thanks for supporting my work!'
    });

    // Create demo payments with dates spread over the last 30 days
    const demoPayments = [];
    
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const amount = Math.floor(Math.random() * 50) + 5; // Random amount between 5-55
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      const payment = await DataStore.createPayment({
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        amount,
        currency: 'SUI',
        message: i % 3 === 0 ? `Great work! Payment ${i + 1}` : undefined,
        donorName: i % 2 === 0 ? `Donor${i + 1}` : undefined,
        donorEmail: undefined,
        isAnonymous: i % 2 !== 0,
        fromAddress: `0x${Math.random().toString(16).substring(2, 66)}`,
        toAddress: demoCreator.walletAddress,
        blockHeight: Math.floor(Math.random() * 100000),
        timestamp: timestamp.toISOString(),
        creatorId: demoCreator.id
      });
      
      demoPayments.push(payment);
    }

    // Create authentication token for demo user
    const token = await AuthService.createSession(
      demoCreator.id,
      demoCreator.email,
      demoCreator.username
    );

    return NextResponse.json({
      message: 'Demo data created successfully',
      creator: demoCreator,
      payments: demoPayments.length,
      token,
      totalAmount: demoPayments.reduce((sum, p) => sum + p.amount, 0)
    });

  } catch (error) {
    console.error('Demo data creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo data' }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get current demo data status
    const demoCreator = await DataStore.findCreatorByUsername('demo');
    
    if (!demoCreator) {
      return NextResponse.json({
        exists: false,
        message: 'No demo data found'
      });
    }

    const { payments } = await DataStore.getCreatorPayments(demoCreator.id);
    const analytics = await DataStore.getCreatorAnalytics(demoCreator.id);

    return NextResponse.json({
      exists: true,
      creator: demoCreator,
      paymentsCount: payments.length,
      totalAmount: analytics.overview.totalAmount,
      analytics: analytics.overview
    });

  } catch (error) {
    console.error('Demo data status error:', error);
    return NextResponse.json(
      { error: 'Failed to get demo data status' }, 
      { status: 500 }
    );
  }
}
