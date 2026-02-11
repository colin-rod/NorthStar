<script lang="ts">
  /**
   * Signup Page
   *
   * User registration with email/password.
   */

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<div class="min-h-screen flex items-center justify-center p-4">
  <Card class="w-full max-w-md">
    <CardHeader>
      <h1 class="text-2xl font-bold">Create Account</h1>
      <p class="text-muted-foreground">Sign up for Personal Issue Tracker</p>
    </CardHeader>
    <CardContent>
      <form method="POST" action="?/signup" class="space-y-4">
        {#if form?.error}
          <Alert variant="destructive">
            <AlertDescription>{form.error}</AlertDescription>
          </Alert>
        {/if}

        {#if form?.success}
          <Alert>
            <AlertDescription>
              Account created! Check your email to confirm your account.
            </AlertDescription>
          </Alert>
        {/if}

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
          <p class="text-xs text-muted-foreground">Minimum 6 characters</p>
        </div>

        <div class="space-y-2">
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" class="w-full">Sign Up</Button>
      </form>

      <div class="mt-4 text-center text-sm">
        Already have an account?
        <a href="/auth/login" class="text-primary hover:underline"> Sign in </a>
      </div>
    </CardContent>
  </Card>
</div>
