import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { withAuth } from '@/lib/auth';

async function getAnalytics(req: NextRequest & { creator: any }) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const type = searchParams.get('type') || 'overview';

    const periodDays = parseInt(period);

    if (type === 'overview') {
      // Get analytics data using DataStore
      const analyticsData = await DataStore.getCreatorAnalytics(req.creator.id, periodDays);

      return NextResponse.json(analyticsData);

    } else if (type === 'payments') {
      // Get payment analytics grouped by day
      const { chartData } = await DataStore.getCreatorAnalytics(req.creator.id, periodDays);
      
      const payments = chartData.map(day => ({
        date: day.date,
        count: day.payments,
        total: day.amount,
        average: day.payments > 0 ? day.amount / day.payments : 0,
        uniqueDonors: day.donors
      }));

      return NextResponse.json({ payments });

    } else if (type === 'donors') {
      // Get top donors
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const { payments } = await DataStore.getCreatorPayments(req.creator.id, { startDate, endDate });
      
      // Group by fromAddress and calculate stats
      const donorMap = new Map<string, {
        fromAddress: string;
        donorName?: string;
        paymentCount: number;
        totalAmount: number;
        lastPayment: string;
      }>();

      payments
        .filter(p => !p.isAnonymous)
        .forEach(payment => {
          const existing = donorMap.get(payment.fromAddress);
          if (existing) {
            existing.paymentCount++;
            existing.totalAmount += payment.amount;
            if (new Date(payment.timestamp) > new Date(existing.lastPayment)) {
              existing.lastPayment = payment.timestamp;
              existing.donorName = payment.donorName;
            }
          } else {
            donorMap.set(payment.fromAddress, {
              fromAddress: payment.fromAddress,
              donorName: payment.donorName,
              paymentCount: 1,
              totalAmount: payment.amount,
              lastPayment: payment.timestamp
            });
          }
        });

      const topDonors = Array.from(donorMap.values())
        .map(donor => ({
          ...donor,
          averageAmount: donor.totalAmount / donor.paymentCount
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      return NextResponse.json({ topDonors });
    }

    return NextResponse.json(
      { error: 'Invalid analytics type' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAnalytics);
