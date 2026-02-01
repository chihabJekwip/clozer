import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabase, getSession } from '@/lib/supabase';

// Create admin client with service role key for admin operations
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
              process.env.NEXT_PUBLIC_clozer_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.clozer_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis (name, email, password, role)' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'commercial'].includes(role)) {
      return NextResponse.json(
        { error: 'Le rôle doit être "admin" ou "commercial"' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Get admin Supabase client
    const adminSupabase = getAdminSupabase();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since admin is creating the account
      user_metadata: {
        name,
        role,
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      
      // Translate common errors
      let errorMessage = authError.message;
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        errorMessage = 'Un utilisateur avec cet email existe déjà';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    // Create user profile in clozer_users table
    const supabase = getSupabase();
    const { data: profileData, error: profileError } = await supabase
      .from('clozer_users')
      .insert({
        id: authData.user.id, // Use the same ID as auth user
        name,
        email,
        role,
        notification_preferences: { email: true, push: true, sms: false },
        theme: 'system',
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Rollback: delete the auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil utilisateur' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
      },
      message: `Utilisateur ${name} créé avec succès`,
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Prevent deletion of default admin
    if (userId === '00000000-0000-0000-0000-000000000001') {
      return NextResponse.json(
        { error: 'Impossible de supprimer l\'administrateur par défaut' },
        { status: 403 }
      );
    }

    // Get admin Supabase client
    const adminSupabase = getAdminSupabase();
    const supabase = getSupabase();

    // Delete from clozer_users first
    const { error: profileError } = await supabase
      .from('clozer_users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
    }

    // Delete from Supabase Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth user deletion error:', authError);
      // Don't fail if user doesn't exist in auth (might be a legacy user)
      if (!authError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Erreur lors de la suppression du compte' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: '/api/auth/create-user'
  });
}
