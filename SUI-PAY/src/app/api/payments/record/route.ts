import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
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
    const existingPayment = await DataStore.findPaymentByTxHash(txHash);

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already recorded' }, 
        { status: 409 }
      );
    }

    // Verify creator exists
    const creator = await DataStore.findCreatorById(creatorId);

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

    // Record payment in DataStore
    const payment = await DataStore.createPayment({
      txHash,
      amount,
      currency: 'SUI',
      message: message || undefined,
      donorName: isAnonymous ? undefined : (donorName || undefined),
      donorEmail: isAnonymous ? undefined : (donorEmail || undefined),
      isAnonymous: isAnonymous || false,
      fromAddress,
      toAddress: creator.walletAddress,
      blockHeight: txDetails.checkpoint ? parseInt(txDetails.checkpoint) : undefined,
      timestamp: timestamp.toISOString(),
      creatorId
    });

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment
    }, { status: 201 });

  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
