import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    // This should be called from API routes with proper auth context
    // For now, we'll need to extract the token from the request headers
    // in the actual API route implementations
    return null;
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
    };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}

export async function getAdminUserFromRequest(request: Request): Promise<AdminUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      // Try to get token from cookies as fallback
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map(c => c.trim().split('='))
        );
        const accessToken = cookies['sb-access-token'] || cookies['sb:token'];
        if (accessToken) {
          return await verifyAdminToken(accessToken);
        }
      }
      return null;
    }

    return await verifyAdminToken(token);
  } catch (error) {
    console.error('Error getting admin user from request:', error);
    return null;
  }
}