import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUserFromRequest } from '@/lib/adminAuthServer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

// GET /api/admin/products/[id]/views - Get configured views for a product
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

    // Get product with views configuration (stored in a JSONB field or separate table)
    // For now, we'll infer views from existing ProductVariants
    const { data: variants, error: variantsError } = await supabase
      .from('ProductVariants')
      .select('view')
      .eq('product_id', productId);

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
    }

    // Get unique views
    const configuredViews = Array.from(new Set(variants?.map(v => v.view) || []));
    
    // Default views if none configured
    const availableViews: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];

    return NextResponse.json({ 
      configuredViews,
      availableViews,
      productId
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/views - Configure views for a product
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
    const { views } = body;

    if (!Array.isArray(views) || views.length === 0) {
      return NextResponse.json({ error: 'Views array is required' }, { status: 400 });
    }

    // Validate views
    const validViews: ProductView[] = ['FRONT', 'BACK', 'LEFT', 'RIGHT'];
    const invalidViews = views.filter((v: string) => !validViews.includes(v as ProductView));
    if (invalidViews.length > 0) {
      return NextResponse.json({ error: 'Invalid view values' }, { status: 400 });
    }

    // Get existing variants
    const { data: existingVariants } = await supabase
      .from('ProductVariants')
      .select('id, view, color')
      .eq('product_id', productId);

    // Get unique colors
    const { data: colorVariants } = await supabase
      .from('ProductVariants')
      .select('color')
      .eq('product_id', productId);
    
    const uniqueColors = Array.from(new Set(colorVariants?.map(v => v.color) || ['white']));

    // Create missing variants for new views
    for (const view of views) {
      for (const color of uniqueColors) {
        const exists = existingVariants?.some(v => v.view === view && v.color === color);
        if (!exists) {
          await supabase
            .from('ProductVariants')
            .insert({
              product_id: productId,
              view,
              color,
              image_url: null
            });
        }
      }
    }

    // Delete variants for removed views
    const viewsToRemove = validViews.filter(v => !views.includes(v));
    for (const view of viewsToRemove) {
      await supabase
        .from('ProductVariants')
        .delete()
        .eq('product_id', productId)
        .eq('view', view);
    }

    return NextResponse.json({ 
      message: 'Views configured successfully',
      configuredViews: views 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
