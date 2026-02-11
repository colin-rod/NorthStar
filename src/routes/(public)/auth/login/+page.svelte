<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
  import Tabs from '$lib/components/ui/tabs.svelte';
  import TabsList from '$lib/components/ui/tabs-list.svelte';
  import TabsTrigger from '$lib/components/ui/tabs-trigger.svelte';
  import TabsContent from '$lib/components/ui/tabs-content.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Alert from '$lib/components/ui/alert.svelte';
  import AlertDescription from '$lib/components/ui/alert-description.svelte';

  let { form }: { form: ActionData } = $props();

  let loginLoading = $state(false);
  let signupLoading = $state(false);
  let magicLinkLoading = $state(false);
</script>

<div class="container max-w-lg mx-auto px-4 py-8 md:py-16">
  <Card>
    <CardHeader>
      <h1 class="text-2xl font-bold">Issue Tracker</h1>
      <p class="text-muted-foreground">Sign in to manage your projects</p>
    </CardHeader>

    <CardContent>
      {#if form?.error}
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{form.error}</AlertDescription>
        </Alert>
      {/if}

      {#if form?.success}
        <Alert class="mb-4">
          <AlertDescription>{form.message}</AlertDescription>
        </Alert>
      {/if}

      <Tabs defaultValue="login">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form
            method="POST"
            action="?/login"
            use:enhance={() => {
              loginLoading = true;
              return async ({ update }) => {
                await update();
                loginLoading = false;
              };
            }}
          >
            <div class="space-y-4">
              <div>
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  inputmode="email"
                  value={form?.email || ''}
                  required
                />
              </div>
              <div>
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autocomplete="current-password"
                  required
                />
              </div>
              <Button type="submit" class="w-full" disabled={loginLoading}>
                {loginLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form
            method="POST"
            action="?/signup"
            use:enhance={() => {
              signupLoading = true;
              return async ({ update }) => {
                await update();
                signupLoading = false;
              };
            }}
          >
            <div class="space-y-4">
              <div>
                <Label for="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  inputmode="email"
                  value={form?.email || ''}
                  required
                />
              </div>
              <div>
                <Label for="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div>
                <Label for="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  name="confirmPassword"
                  autocomplete="new-password"
                  required
                />
              </div>
              <Button type="submit" class="w-full" disabled={signupLoading}>
                {signupLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form
            method="POST"
            action="?/magiclink"
            use:enhance={() => {
              magicLinkLoading = true;
              return async ({ update }) => {
                await update();
                magicLinkLoading = false;
              };
            }}
          >
            <div class="space-y-4">
              <div>
                <Label for="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  inputmode="email"
                  value={form?.email || ''}
                  required
                />
              </div>
              <Button type="submit" class="w-full" disabled={magicLinkLoading}>
                {magicLinkLoading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</div>
