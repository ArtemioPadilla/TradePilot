import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { withBase } from '@/lib/href';
import { isSupabaseConfigured } from '@/lib/data/supabaseClient';
import { provideRepos } from '@/lib/data/supabase';
import { LoginSchema, type LoginValues } from '@/schemas/login';
import { RegisterSchema, type RegisterValues } from '@/schemas/register';
import ErrorBoundary from './ErrorBoundary';

/**
 * Login/register island for /auth. Single island (compound Tabs cannot span
 * hydration boundaries). On success navigates to the app dashboard.
 *
 * Error copy never distinguishes "wrong password" from "no such account"
 * (no user enumeration).
 */
function LoginForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    setBusy(true);
    try {
      await provideRepos().auth.signInWithPassword(values);
      location.assign(withBase('/app/'));
    } catch {
      setError('Incorrect email or password.');
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [checkEmail, setCheckEmail] = React.useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterValues) {
    setError(null);
    setBusy(true);
    try {
      const session = await provideRepos().auth.signUp(
        { email: values.email, password: values.password },
        { name: values.name },
      );
      if (session) {
        // Email confirmation disabled → session is live immediately.
        location.assign(withBase('/app/'));
      } else {
        setCheckEmail(true);
        setBusy(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(
        /already|registered/i.test(message)
          ? 'That email may already have an account. Try signing in.'
          : 'Could not create the account. Please try again.',
      );
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <Alert variant="success">
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          We sent a confirmation link. Open it to finish creating your account.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Ada Lovelace" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}

export default function AuthForms() {
  const [oauthError, setOauthError] = React.useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <Alert>
        <AlertTitle>Auth not configured</AlertTitle>
        <AlertDescription>
          This build has no Supabase project configured (PUBLIC_SUPABASE_URL /
          PUBLIC_SUPABASE_ANON_KEY). Sign-in is unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  async function google() {
    setOauthError(null);
    try {
      await provideRepos().auth.signInWithGoogle();
      // Redirect navigates away; nothing else to do.
    } catch {
      setOauthError('Google sign-in is not available right now.');
    }
  }

  return (
    <ErrorBoundary name="AuthForms">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continue with Google
        </Button>
        {oauthError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {oauthError}
          </p>
        )}
      </div>
    </ErrorBoundary>
  );
}
