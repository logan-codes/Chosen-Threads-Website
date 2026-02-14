import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProductView = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { data: variants, error: variantsError } = await supabase
      .from('ProductVariants')
      .select('view')
      .eq('product_id', productId);

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
    }

    const configuredViews = Array.from(new Set(variants?.map(v => v.view) || []));
    
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
