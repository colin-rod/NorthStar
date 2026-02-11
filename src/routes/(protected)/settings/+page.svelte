<script lang="ts">
  /**
   * Settings Page
   *
   * User profile, account settings, and placeholder sections
   */

  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/button.svelte';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loggingOut = $state(false);
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold">Settings</h1>

  <!-- Profile Section -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Profile</h2>
    </CardHeader>
    <CardContent class="space-y-4">
      <div>
        <p class="text-sm text-muted-foreground">Signed in as</p>
        <p class="text-lg font-medium">{data.session?.user.email}</p>
      </div>
    </CardContent>
  </Card>

  <!-- Account Section -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Account</h2>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="/?/logout"
        use:enhance={() => {
          loggingOut = true;
          return async ({ update }) => {
            await update();
            loggingOut = false;
          };
        }}
      >
        <Button type="submit" variant="destructive" disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </form>
    </CardContent>
  </Card>

  <!-- Theme Section (Placeholder) -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Theme</h2>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground">Coming soon</p>
    </CardContent>
  </Card>

  <!-- Notifications Section (Placeholder) -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Notifications</h2>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground">Coming soon</p>
    </CardContent>
  </Card>

  <!-- Data & Privacy Section (Placeholder) -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Data & Privacy</h2>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground">Coming soon</p>
    </CardContent>
  </Card>

  <!-- Archived Projects Section -->
  <Card>
    <CardHeader>
      <h2 class="text-xl font-semibold">Archived Projects</h2>
      <p class="text-sm text-foreground-secondary mt-1">
        Restore archived projects to make them active again.
      </p>
    </CardHeader>
    <CardContent>
      {#if data.archivedProjects && data.archivedProjects.length === 0}
        <p class="text-foreground-muted">No archived projects.</p>
      {:else if data.archivedProjects}
        <div class="space-y-2">
          {#each data.archivedProjects as project}
            <div
              class="flex items-center justify-between p-4 border border-border rounded-md bg-surface"
            >
              <div>
                <p class="font-medium">{project.name}</p>
                <p class="text-sm text-foreground-muted">
                  Archived {new Date(project.archived_at).toLocaleDateString()}
                </p>
              </div>
              <form method="POST" action="?/unarchiveProject" use:enhance>
                <input type="hidden" name="id" value={project.id} />
                <Button type="submit" variant="outline" size="sm">Restore</Button>
              </form>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-foreground-muted">Loading archived projects...</p>
      {/if}
    </CardContent>
  </Card>
</div>
