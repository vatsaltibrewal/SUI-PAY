import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SuiTransactionUtils } from '@/lib/sui';

export async function POST(req: NextRequest) {
  try {
    const { 
      txHash, 
      creatorId, 
      message, 
      donorName, 
      donorEmail, 
      isAnonymous 
    } = await req.json();

    // Validation
    if (!txHash || !creatorId) {
      return NextResponse.json(
        { error: 'Transaction hash and creator ID are required' }, 
        { status: 400 }
      );
    }

    // Check if payment already recorded
    const existingPayment = await prisma.payment.findUnique({
      where: { txHash }
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already recorded' }, 
        { status: 409 }
      );
    }

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    // Get transaction details from SUI blockchain
    const txDetails = await SuiTransactionUtils.getTransactionDetails(txHash);
    
    if (!txDetails) {
      return NextResponse.json(
        { error: 'Transaction not found on blockchain' }, 
        { status: 404 }
      );
    }

    // Extract payment information from transaction
    const balanceChanges = txDetails.balanceChanges || [];
    const creatorBalanceChange = balanceChanges.find(
      change => change.owner === creator.walletAddress && change.coinType === '0x2::sui::SUI'
    );

    if (!creatorBalanceChange || parseInt(creatorBalanceChange.amount) <= 0) {
      return NextResponse.json(
        { error: 'No valid payment found in transaction' }, 
        { status: 400 }
      );
    }

    const amount = SuiTransactionUtils.formatSuiAmount(creatorBalanceChange.amount);
    const fromAddress = txDetails.transaction?.data?.sender || '';
    const timestamp = new Date(parseInt(txDetails.timestampMs || '0'));

    // Record payment in database
    const payment = await prisma.payment.create({
      data: {
        txHash,
        amount,
        currency: 'SUI',
        message: message || null,
        donorName: isAnonymous ? null : (donorName || null),
        donorEmail: isAnonymous ? null : (donorEmail || null),
        isAnonymous: isAnonymous || false,
        fromAddress,
        toAddress: creator.walletAddress,
        blockHeight: txDetails.checkpoint ? parseInt(txDetails.checkpoint) : null,
        timestamp,
        creatorId
      }
    });

    // Update or create analytics record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.analytics.upsert({
      where: {
        creatorId_date: {
          creatorId,
          date: today
        }
      },
      update: {
        totalPayments: { increment: 1 },
        totalAmount: { increment: amount },
        // Note: uniqueDonors calculation would need more complex logic
      },
      create: {
        creatorId,
        date: today,
        totalPayments: 1,
        totalAmount: amount,
        uniqueDonors: 1,
        averageAmount: amount
      }
    });

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment,
      analytics
    }, { status: 201 });

  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
