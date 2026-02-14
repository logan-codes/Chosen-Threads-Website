import { supabase } from './supabaseClient';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: 'Invalid credentials' };
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed' };
    }

    console.log('User authenticated:', authData.user.id);

    // Wait a moment for session to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    console.log('Profile check:', { profile, profileError });

    if (profileError) {
      console.error('Profile error:', profileError);
      await supabase.auth.signOut();
      return { success: false, error: 'Error checking admin privileges. Please try again.' };
    }

    if (!profile || profile.role !== 'admin') {
      console.log('Not an admin:', profile);
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    const adminUser: AdminUser = {
      id: authData.user.id,
      email: authData.user.email!,
      role: profile.role,
    };

    console.log('Admin login successful:', adminUser);
    return { success: true, user: adminUser };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { success: false, error: 'Authentication service unavailable' };
  }
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    // First check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session');
      return null;
    }

    const user = session.user;
    
    if (!user) {
      console.log('No user in session');
      return null;
    }

    console.log('Checking admin status for user:', user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    if (!profile) {
      console.log('No profile found for user');
      return null;
    }

    if (profile.role !== 'admin') {
      console.log('User is not an admin:', profile.role);
      return null;
    }

    console.log('Admin user verified:', user.email);
    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
    };
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
}

export async function createAdminProfile(userId: string, email: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        role: 'admin',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating admin profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createAdminProfile:', error);
    throw error;
  }
}