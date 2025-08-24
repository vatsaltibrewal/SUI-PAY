import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function updateLink(req: NextRequest & { creator: any }, context: { params: { linkId: string } }) {
  try {
    const { linkId } = context.params;
    const { title, description, buttonText, theme, isActive } = await req.json();

    // Verify link belongs to creator
    const existingLink = await prisma.shareableLink.findFirst({
      where: {
        id: linkId,
        creatorId: req.creator.id
      }
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' }, 
        { status: 404 }
      );
    }

    const updatedLink = await prisma.shareableLink.update({
      where: { id: linkId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(buttonText && { buttonText }),
        ...(theme && { theme }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      message: 'Link updated successfully',
      link: updatedLink
    });

  } catch (error) {
    console.error('Update link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function deleteLink(req: NextRequest & { creator: any }, context: { params: { linkId: string } }) {
  try {
    const { linkId } = context.params;

    // Verify link belongs to creator
    const existingLink = await prisma.shareableLink.findFirst({
      where: {
        id: linkId,
        creatorId: req.creator.id
      }
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' }, 
        { status: 404 }
      );
    }

    await prisma.shareableLink.delete({
      where: { id: linkId }
    });

    return NextResponse.json({
      message: 'Link deleted successfully'
    });

  } catch (error) {
    console.error('Delete link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateLink);
export const DELETE = withAuth(deleteLink);
