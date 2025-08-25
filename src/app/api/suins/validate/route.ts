import { NextRequest, NextResponse } from 'next/server';
import { SuiNameService } from '@/lib/sui';

export async function POST(req: NextRequest) {
  try {
    const { nameOrAddress } = await req.json();
    
    if (!nameOrAddress) {
      return NextResponse.json(
        { error: 'Name or address is required' },
        { status: 400 }
      );
    }

    // Validate and resolve the name or address
    const result = await SuiNameService.validateAndResolveName(nameOrAddress);
    
    return NextResponse.json({
      input: nameOrAddress,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SUI NS validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate name or address' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address');
    
    if (!name && !address) {
      return NextResponse.json(
        { error: 'Either name or address parameter is required' },
        { status: 400 }
      );
    }

    let result;
    
    if (name) {
      // Resolve name to address
      const resolvedAddress = await SuiNameService.resolveName(name);
      result = {
        input: name,
        type: 'name_resolution',
        resolvedAddress,
        isValid: !!resolvedAddress
      };
    } else if (address) {
      // Get name for address
      const resolvedName = await SuiNameService.getNameByAddress(address);
      result = {
        input: address,
        type: 'reverse_lookup',
        resolvedName,
        isValid: !!resolvedName
      };
    }
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SUI NS validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate name or address' },
      { status: 500 }
    );
  }
}
