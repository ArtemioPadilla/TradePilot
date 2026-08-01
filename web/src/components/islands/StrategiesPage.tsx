import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { generateStrategy } from '@/lib/ai/ai-strategy';
import { provideRepos } from '@/lib/data/supabase';
import type { Strategy } from '@/lib/data/contracts';
import {
  StrategyFormSchema,
  StrategyParamsSchema,
  type StrategyFormInput,
  type StrategyFormValues,
} from '@/schemas/strategy';
import AuthGuard from './AuthGuard';
import ErrorBoundary from './ErrorBoundary';

// Monaco is a heavy chunk — loaded lazily only when the custom-code editor
// opens. Same React root (island), so compound state still works.
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

function editorTheme(): 'vs-dark' | 'light' {
  if (typeof document === 'undefined') return 'vs-dark';
  return document.documentElement.classList.contains('dark') ||
    document.documentElement.dataset.theme === 'dark'
    ? 'vs-dark'
    : 'light';
}

const TYPE_LABELS: Record<string, string> = {
  momentum: 'Momentum',
  meanReversion: 'Mean reversion',
  smartBeta: 'Smart beta',
  custom: 'Custom code',
};

function StrategyForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Strategy | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiNote, setAiNote] = React.useState<string | null>(null);

  const parsedParams = StrategyParamsSchema.safeParse(initial?.params ?? {});
  const form = useForm<StrategyFormInput, unknown, StrategyFormValues>({
    resolver: zodResolver(StrategyFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      type: (initial?.type as StrategyFormValues['type']) ?? 'momentum',
      params: parsedParams.success ? parsedParams.data : { t: 10, window: 60, topN: 5 },
      code: initial?.code ?? '',
      is_public: initial?.is_public ?? false,
    },
  });

  const type = form.watch('type');

  async function assist() {
    if (!aiPrompt.trim()) return;
    const res = await generateStrategy({ prompt: aiPrompt, mode: 'demo' });
    if (res.success) {
      form.setValue('code', res.code, { shouldDirty: true });
      if (!form.getValues('name')) form.setValue('name', res.name);
      setAiNote(`Loaded "${res.name}" — ${res.explanation}`);
    }
  }

  async function onSubmit(values: StrategyFormValues) {
    setError(null);
    setBusy(true);
    try {
      const repos = provideRepos();
      const payload = {
        name: values.name,
        type: values.type,
        params: values.params,
        code: values.type === 'custom' ? (values.code ?? '') : null,
        is_public: values.is_public,
      };
      if (initial) {
        await repos.strategies.update(initial.id, payload);
      } else {
        await repos.strategies.create(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the strategy.');
      setBusy(false);
    }
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
                <Input placeholder="Weekly momentum top-5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="params.t"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lookback (t)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="params.window"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Window</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="params.topN"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top N</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === 'custom' && (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Strategy code</p>
            <FormDescription>
              A function <code>strategy(prices, params)</code> returning symbols sorted by
              preference. Describe an idea and let the builder draft it:
            </FormDescription>
            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. RSI mean reversion on oversold names"
                aria-label="Describe a strategy idea"
              />
              <Button type="button" variant="outline" onClick={assist}>
                Draft it
              </Button>
            </div>
            {aiNote && <p className="text-xs text-muted-foreground">{aiNote}</p>}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Code</FormLabel>
                  <FormControl>
                    <div className="overflow-hidden rounded-md border border-border">
                      <React.Suspense
                        fallback={
                          <Textarea
                            rows={12}
                            spellCheck={false}
                            className="font-mono text-xs"
                            value={String(field.value ?? '')}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        }
                      >
                        <MonacoEditor
                          height="300px"
                          defaultLanguage="typescript"
                          theme={editorTheme()}
                          value={String(field.value ?? '')}
                          onChange={(v) => field.onChange(v ?? '')}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                          }}
                        />
                      </React.Suspense>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Public</FormLabel>
                <FormDescription>Anyone can view it in the community browser.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Create strategy'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function StrategiesList() {
  const [strategies, setStrategies] = React.useState<Strategy[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Strategy | null>(null);

  const load = React.useCallback(() => {
    provideRepos()
      .strategies.list()
      .then(setStrategies)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load strategies.'));
  }, []);

  React.useEffect(load, [load]);

  async function remove(s: Strategy) {
    try {
      await provideRepos().strategies.remove(s.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the strategy.');
    }
  }

  if (error) {
    return (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }

  if (!strategies) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading strategies">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {strategies.length === 0
            ? 'No strategies yet.'
            : `${strategies.length} strateg${strategies.length === 1 ? 'y' : 'ies'}.`}
        </p>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger render={<Button>New strategy</Button>} />
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit strategy' : 'New strategy'}</DialogTitle>
              <DialogDescription>
                Ranking + optimization settings used by the backtester.
              </DialogDescription>
            </DialogHeader>
            <StrategyForm
              initial={editing}
              onSaved={() => {
                setDialogOpen(false);
                setEditing(null);
                load();
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {strategies.length === 0 ? (
        <EmptyState
          title="Create your first strategy"
          description="Momentum, mean reversion, smart beta — or describe your own and let the builder draft the code."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {strategies.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{s.name}</span>
                  {s.is_public && <Badge variant="secondary">Public</Badge>}
                </CardTitle>
                <CardDescription>{TYPE_LABELS[s.type] ?? s.type}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Updated {new Date(s.updated_at).toLocaleDateString()}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(s);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(s)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StrategiesPage() {
  return (
    <AuthGuard>
      <ErrorBoundary name="StrategiesPage">
        <StrategiesList />
      </ErrorBoundary>
    </AuthGuard>
  );
}
