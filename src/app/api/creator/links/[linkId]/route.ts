import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/storage';
import { withAuth } from '@/lib/auth';

async function updateLink(req: NextRequest & { creator: any }, context: { params: { linkId: string } }) {
  try {
    const { linkId } = context.params;
    const { title, description, buttonText, theme, isActive } = await req.json();

    // Verify link belongs to creator
    const creatorLinks = await DataStore.getCreatorLinks(req.creator.id);
    const existingLink = creatorLinks.find(link => link.id === linkId);

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' }, 
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (buttonText) updateData.buttonText = buttonText;
    if (theme) updateData.theme = theme;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedLink = await DataStore.updateLink(linkId, updateData);

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
    const creatorLinks = await DataStore.getCreatorLinks(req.creator.id);
    const existingLink = creatorLinks.find(link => link.id === linkId);

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Link not found' }, 
        { status: 404 }
      );
    }

    await DataStore.deleteLink(linkId);

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
