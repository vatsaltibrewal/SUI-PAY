import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function getAnalytics(req: NextRequest & { creator: any }) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const type = searchParams.get('type') || 'overview';

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (type === 'overview') {
      // Get overall statistics
      const [totalStats, recentPayments, dailyAnalytics] = await Promise.all([
        // Total statistics
        prisma.payment.aggregate({
          where: {
            creatorId: req.creator.id,
            timestamp: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true },
          _avg: { amount: true },
          _count: true
        }),

        // Recent payments for activity feed
        prisma.payment.findMany({
          where: {
            creatorId: req.creator.id,
            timestamp: { gte: startDate, lte: endDate }
          },
          orderBy: { timestamp: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            message: true,
            donorName: true,
            isAnonymous: true,
            timestamp: true
          }
        }),

        // Daily analytics for chart
        prisma.analytics.findMany({
          where: {
            creatorId: req.creator.id,
            date: { gte: startDate, lte: endDate }
          },
          orderBy: { date: 'asc' }
        })
      ]);

      // Get unique donors count
      const uniqueDonors = await prisma.payment.findMany({
        where: {
          creatorId: req.creator.id,
          timestamp: { gte: startDate, lte: endDate }
        },
        distinct: ['fromAddress'],
        select: { fromAddress: true }
      });

      return NextResponse.json({
        overview: {
          totalAmount: totalStats._sum.amount || 0,
          averageAmount: totalStats._avg.amount || 0,
          totalPayments: totalStats._count,
          uniqueDonors: uniqueDonors.length,
          period: periodDays
        },
        recentPayments,
        dailyData: dailyAnalytics,
        chartData: dailyAnalytics.map(day => ({
          date: day.date.toISOString().split('T')[0],
          amount: day.totalAmount,
          payments: day.totalPayments,
          donors: day.uniqueDonors
        }))
      });

    } else if (type === 'payments') {
      // Get payment analytics grouped by day
      const payments = await prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count,
          SUM(amount) as total,
          AVG(amount) as average,
          COUNT(DISTINCT fromAddress) as uniqueDonors
        FROM payments 
        WHERE creatorId = ${req.creator.id}
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `;

      return NextResponse.json({ payments });

    } else if (type === 'donors') {
      // Get top donors
      const topDonors = await prisma.$queryRaw`
        SELECT 
          fromAddress,
          donorName,
          COUNT(*) as paymentCount,
          SUM(amount) as totalAmount,
          AVG(amount) as averageAmount,
          MAX(timestamp) as lastPayment
        FROM payments 
        WHERE creatorId = ${req.creator.id}
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
          AND isAnonymous = false
        GROUP BY fromAddress, donorName
        ORDER BY totalAmount DESC
        LIMIT 10
      `;

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
