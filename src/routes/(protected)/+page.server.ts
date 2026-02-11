/**
 * Home Page Server Load
 *
 * Loads all issues with their relations for the home view.
 */

import { redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: issues, error } = await locals.supabase
    .from('issues')
    .select(
      `
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      dependencies:dependencies(
        depends_on_issue_id,
        depends_on_issue:issues(*)
      )
    `,
    )
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading issues:', error);
    return { issues: [] };
  }

  return {
    issues: issues || [],
  };
};

/**
 * Form Actions
 */
export const actions: Actions = {
  /**
   * Logout action
   */
  logout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut();
    redirect(303, '/auth/login');
  },

  /**
   * Update an issue
   */
  updateIssue: async ({ request }) => {
    const _formData = await request.formData();
    const _id = _formData.get('id') as string;

    // TODO: Validate form data
    // TODO: Update issue in database
    // TODO: Return success/error

    return { success: true };
  },

  /**
   * Create a new issue
   */
  createIssue: async ({ request }) => {
    const _formData = await request.formData();

    // TODO: Validate form data
    // TODO: Create issue in database
    // TODO: Return success/error with new issue ID

    return { success: true };
  },
};
