import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { withAuth } from '@/lib/auth';

async function getProfile(req: NextRequest & { creator: any }) {
  try {
    // For now, return the creator info from the token
    // In a full implementation, you'd fetch from storage
    const creatorData = req.creator;

    // Get counts from storage
    const [payments, links] = await Promise.all([
      DataStore.getCreatorPayments(creatorData.id),
      DataStore.getCreatorLinks(creatorData.id)
    ]);

    const creator = {
      ...creatorData,
      _count: {
        payments: payments.total,
        links: links.length
      }
    };

    return NextResponse.json({ creator });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function updateProfile(req: NextRequest & { creator: any }) {
  try {
    const { 
      displayName, 
      bio, 
      avatar, 
      twitterHandle, 
      websiteUrl,
      minDonationAmount,
      customMessage
    } = await req.json();

    const updates: any = {};
    if (displayName) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (twitterHandle !== undefined) updates.twitterHandle = twitterHandle;
    if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;
    if (minDonationAmount) updates.minDonationAmount = minDonationAmount;
    if (customMessage !== undefined) updates.customMessage = customMessage;

    const updatedCreator = await DataStore.updateCreator(req.creator.id, updates);

    if (!updatedCreator) {
      return NextResponse.json(
        { error: 'Creator not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      creator: updatedCreator
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
