import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function getLinks(req: NextRequest & { creator: any }) {
  try {
    const links = await prisma.shareableLink.findMany({
      where: { creatorId: req.creator.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ links });

  } catch (error) {
    console.error('Get links error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function createLink(req: NextRequest & { creator: any }) {
  try {
    const { title, description, buttonText, theme } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.shareableLink.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const link = await prisma.shareableLink.create({
      data: {
        slug,
        title,
        description: description || null,
        buttonText: buttonText || 'Support Me',
        theme: theme || 'default',
        creatorId: req.creator.id
      }
    });

    return NextResponse.json({
      message: 'Link created successfully',
      link
    }, { status: 201 });

  } catch (error) {
    console.error('Create link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export const GET = withAuth(getLinks);
export const POST = withAuth(createLink);
