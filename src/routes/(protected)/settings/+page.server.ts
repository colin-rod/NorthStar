import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  // Load archived projects
  const { data: archivedProjects, error } = await supabase
    .from('projects')
    .select('*')
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (error) {
    console.error('Error loading archived projects:', error);
    return { session, archivedProjects: [] };
  }

  return {
    session,
    archivedProjects: archivedProjects || [],
  };
};

export const actions: Actions = {
  unarchiveProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'Project ID is required' });
    }

    const { error } = await supabase
      .from('projects')
      .update({ archived_at: null })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Unarchive project error:', error);
      return fail(500, { error: 'Failed to restore project' });
    }

    return { success: true };
  },
};
