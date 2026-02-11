import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    if (!isValidEmail(email)) {
      return fail(400, { error: 'Please enter a valid email address', email });
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail(400, { error: error.message, email });
    }

    redirect(303, '/');
  },

  signup: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (!email || !password || !confirmPassword) {
      return fail(400, { error: 'All fields are required', email });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match', email });
    }

    if (password.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters', email });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/confirm`,
      },
    });

    if (error) {
      return fail(400, { error: error.message, email });
    }

    return {
      success: true,
      message: 'Check your email to confirm your account',
    };
  },

  magiclink: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();

    if (!email || !isValidEmail(email)) {
      return fail(400, { error: 'Please enter a valid email address', email });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${url.origin}/auth/confirm`,
      },
    });

    if (error) {
      return fail(400, { error: error.message, email });
    }

    return {
      success: true,
      message: 'Check your email for the magic link',
    };
  },
};

function isValidEmail(email: string): boolean {
  return /^[\w\-.+]+@([\w-]+\.)+[\w-]{2,8}$/.test(email);
}
