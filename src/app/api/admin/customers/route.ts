import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUserFromRequest } from '@/lib/adminAuthServer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/customers - Get all customers with order data
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get profiles
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Get order data for each customer
    const customerIds = profiles?.map(p => p.id) || [];
    
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select('user_id, total_price, status')
      .in('user_id', customerIds);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Aggregate order data
    const orderStats: Record<string, { count: number; total: number }> = {};
    orders?.forEach(order => {
      if (!orderStats[order.user_id]) {
        orderStats[order.user_id] = { count: 0, total: 0 };
      }
      orderStats[order.user_id].count++;
      orderStats[order.user_id].total += parseFloat(order.total_price || 0);
    });

    // Combine data
    const customers = profiles?.map(profile => ({
      ...profile,
      orders_count: orderStats[profile.id]?.count || 0,
      total_spent: orderStats[profile.id]?.total || 0
    }));

    return NextResponse.json({ 
      customers: customers || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
