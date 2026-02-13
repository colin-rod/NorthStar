/**
 * Signup Page Server Actions
 *
 * Handles user registration via Supabase Auth.
 */

import { redirect, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if already logged in
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();
  if (user) {
    throw redirect(303, '/');
  }
};

export const actions: Actions = {
  signup: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    if (!email || !password || !confirmPassword) {
      return fail(400, {
        error: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        error: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return fail(400, {
        error: 'Password must be at least 6 characters',
      });
    }

    // Sign up with Supabase Auth
    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/confirm`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return fail(400, {
        error: error.message,
      });
    }

    return {
      success: true,
      message: 'Account created! Please check your email to confirm.',
    };
  },
};
