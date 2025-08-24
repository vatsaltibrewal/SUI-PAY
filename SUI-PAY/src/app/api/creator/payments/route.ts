import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { withAuth } from '@/lib/auth';

async function getPayments(req: NextRequest & { creator: any }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build options for DataStore
    const options: any = {
      limit,
      offset,
    };

    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    // Get payments with pagination
    const { payments, total } = await DataStore.getCreatorPayments(req.creator.id, options);

    // Calculate summary statistics
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const averageAmount = payments.length > 0 ? totalAmount / payments.length : 0;

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount,
        averageAmount,
        totalPayments: payments.length
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const GET = withAuth(getPayments);
