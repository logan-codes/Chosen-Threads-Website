import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { signInAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const identifier = `login:${email}:${clientIp}`;

    const rateLimitResult = checkRateLimit(identifier, {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
          }
        }
      );
    }

    const { password } = body;
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const result = await signInAdmin(email, password);

    if (result.success) {
      resetRateLimit(identifier);
      return NextResponse.json({ 
        success: true, 
        user: result.user 
      });
    }

    return NextResponse.json(
      { 
        error: result.error,
        remainingAttempts: rateLimitResult.remainingAttempts
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
