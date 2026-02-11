import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading projects:', error);
    return { projects: [] };
  }

  return { projects: projects || [] };
};

export const actions: Actions = {
  createProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim();

    // Validation
    if (!name || name.length === 0) {
      return fail(400, { error: 'Project name is required' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Project name must be 100 characters or less' });
    }

    // Insert project (DB trigger will auto-create "Unassigned" epic)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return fail(500, { error: 'Failed to create project' });
    }

    return { success: true, action: 'create', project: data };
  },

  updateProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString().trim();

    if (!id) {
      return fail(400, { error: 'Project ID is required' });
    }
    if (!name || name.length === 0) {
      return fail(400, { error: 'Project name is required' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Project name must be 100 characters or less' });
    }

    const { error } = await supabase
      .from('projects')
      .update({ name })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Update project error:', error);
      return fail(500, { error: 'Failed to update project' });
    }

    return { success: true, action: 'update' };
  },

  archiveProject: async ({ request, locals: { supabase, session } }) => {
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
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Archive project error:', error);
      return fail(500, { error: 'Failed to archive project' });
    }

    return { success: true, action: 'archive' };
  },
};
