import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUserFromRequest } from '@/lib/adminAuthServer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface DesignArea {
  id: number;
  product_id: number;
  view: ProductView;
  x: number;
  y: number;
  width: number;
  height: number;
  created_at: string;
}

// GET /api/admin/products/[id]/design-areas - Get all design areas for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const adminUser = await getAdminUserFromRequest(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('DesignAreas')
      .select('*')
      .eq('product_id', productId)
      .order('view', { ascending: true });

    if (error) {
      console.error('Error fetching design areas:', error);
      return NextResponse.json({ error: 'Failed to fetch design areas' }, { status: 500 });
    }

    // Group by view for easier frontend consumption
    const groupedByView: Record<ProductView, DesignArea[]> = {
      FRONT: [],
      BACK: [],
      LEFT: [],
      RIGHT: []
    };

    (data || []).forEach((area: DesignArea) => {
      if (groupedByView[area.view]) {
        groupedByView[area.view].push(area);
      }
    });

    return NextResponse.json({ 
      designAreas: data || [],
      groupedByView 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/design-areas - Create a new design area
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const adminUser = await getAdminUserFromRequest(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { view, x, y, width, height } = body;

    // Validate required fields
    if (!view || x === undefined || y === undefined || width === undefined || height === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate view value
    const validViews: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];
    if (!validViews.includes(view)) {
      return NextResponse.json({ error: 'Invalid view value' }, { status: 400 });
    }

    // Validate coordinates (0-1 range)
    if (x < 0 || x > 1 || y < 0 || y > 1 || width <= 0 || width > 1 || height <= 0 || height > 1) {
      return NextResponse.json({ error: 'Coordinates must be between 0 and 1' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('DesignAreas')
      .insert({
        product_id: productId,
        view,
        x,
        y,
        width,
        height
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating design area:', error);
      return NextResponse.json({ error: 'Failed to create design area' }, { status: 500 });
    }

    return NextResponse.json({ designArea: data, created: true }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]/design-areas - Update a design area
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const adminUser = await getAdminUserFromRequest(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { designAreaId, ...updateData } = body;

    if (!designAreaId) {
      return NextResponse.json({ error: 'Design area ID is required' }, { status: 400 });
    }

    // Validate coordinates if provided
    if (updateData.x !== undefined && (updateData.x < 0 || updateData.x > 1)) {
      return NextResponse.json({ error: 'X coordinate must be between 0 and 1' }, { status: 400 });
    }
    if (updateData.y !== undefined && (updateData.y < 0 || updateData.y > 1)) {
      return NextResponse.json({ error: 'Y coordinate must be between 0 and 1' }, { status: 400 });
    }
    if (updateData.width !== undefined && (updateData.width <= 0 || updateData.width > 1)) {
      return NextResponse.json({ error: 'Width must be between 0 and 1' }, { status: 400 });
    }
    if (updateData.height !== undefined && (updateData.height <= 0 || updateData.height > 1)) {
      return NextResponse.json({ error: 'Height must be between 0 and 1' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('DesignAreas')
      .update(updateData)
      .eq('id', designAreaId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating design area:', error);
      return NextResponse.json({ error: 'Failed to update design area' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Design area not found' }, { status: 404 });
    }

    return NextResponse.json({ designArea: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]/design-areas - Delete a design area
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const adminUser = await getAdminUserFromRequest(request);
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const designAreaId = searchParams.get('designAreaId');

    if (!designAreaId) {
      return NextResponse.json({ error: 'Design area ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('DesignAreas')
      .delete()
      .eq('id', parseInt(designAreaId))
      .eq('product_id', productId);

    if (error) {
      console.error('Error deleting design area:', error);
      return NextResponse.json({ error: 'Failed to delete design area' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Design area deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
