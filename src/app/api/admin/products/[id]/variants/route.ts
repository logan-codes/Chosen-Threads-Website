import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUserFromRequest } from '@/lib/adminAuthServer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

// GET /api/admin/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ProductVariants')
      .select('*')
      .eq('product_id', productId)
      .order('color', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error);
      return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
    }

    return NextResponse.json({ variants: data || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { view, color, image_url } = body;

    // Validate required fields
    if (!view || !color) {
      return NextResponse.json({ error: 'View and color are required' }, { status: 400 });
    }

    // Validate view value
    const validViews: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];
    if (!validViews.includes(view)) {
      return NextResponse.json({ error: 'Invalid view value' }, { status: 400 });
    }

    // Check if variant already exists
    const { data: existingVariant } = await supabase
      .from('ProductVariants')
      .select('*')
      .eq('product_id', productId)
      .eq('view', view)
      .eq('color', color)
      .single();

    if (existingVariant) {
      // Update existing variant
      const { data, error } = await supabase
        .from('ProductVariants')
        .update({ image_url })
        .eq('id', existingVariant.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating variant:', error);
        return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
      }

      return NextResponse.json({ variant: data, updated: true });
    }

    // Create new variant
    const { data, error } = await supabase
      .from('ProductVariants')
      .insert({
        product_id: productId,
        view,
        color,
        image_url
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
    }

    return NextResponse.json({ variant: data, created: true }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]/variants - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { variantId, ...updateData } = body;

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ProductVariants')
      .update(updateData)
      .eq('id', variantId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json({ variant: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]/variants - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    const parsedVariantId = parseInt(variantId);
    if (isNaN(parsedVariantId)) {
      return NextResponse.json({ error: 'Invalid variant ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ProductVariants')
      .delete()
      .eq('id', parsedVariantId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error deleting variant:', error);
      return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
