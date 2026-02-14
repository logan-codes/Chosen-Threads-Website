import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUserFromRequest } from '@/lib/adminAuthServer';
import { SecureFileValidator } from '@/lib/fileSecurity';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication (for order uploads) or admin authentication
    const adminUser = await getAdminUserFromRequest(request);
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let user = adminUser;
    if (!user && token) {
      // If not admin, check if it's a regular authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser) {
        user = { id: authUser.id, email: authUser.email!, role: 'user' };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file securely
    const validation = await SecureFileValidator.validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || 'Invalid file' 
      }, { status: 400 });
    }

    // Validate image dimensions
    const dimensionValidation = await SecureFileValidator.validateImageDimensions(file);
    if (!dimensionValidation.isValid) {
      return NextResponse.json({ 
        error: dimensionValidation.error || 'Invalid image dimensions' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate secure file path
    const userId = user.id;
    const timestamp = Date.now();
    const fileName = `${validation.sanitizedFileName}`;
    const filePath = `orders/${userId}/${orderId ? orderId + '/' : ''}${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('orders')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 });
    }

    // Get public URL (or signed URL for private files)
    const { data: { publicUrl } } = supabase.storage
      .from('orders')
      .getPublicUrl(filePath);

    // Log the upload for security auditing
    try {
      await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          file_name: fileName,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          upload_time: new Date().toISOString(),
          order_id: orderId ? parseInt(orderId) : null
        });
    } catch (logError) {
      console.error('Failed to log upload:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        path: filePath,
        size: file.size,
        type: file.type,
        url: publicUrl,
        dimensions: {
          width: dimensionValidation.width,
          height: dimensionValidation.height
        }
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication (only admins can delete files)
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from('orders')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete file' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}