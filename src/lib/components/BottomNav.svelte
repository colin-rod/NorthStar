<script lang="ts">
	import { page } from '$app/stores';
	import { Home, Folder, Search, Settings } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	// Derive active states from current pathname
	$: pathname = $page.url.pathname;
	$: isHome = pathname === '/';
	$: isProjects = pathname.startsWith('/projects');
	$: isSearch = pathname === '/search';
	$: isSettings = pathname === '/settings';
</script>

<nav class="fixed bottom-0 inset-x-0 z-40 border-t bg-background md:hidden">
	<div class="flex justify-around items-center h-16">
		<a
			href="/"
			aria-label="Home"
			aria-current={isHome ? 'page' : undefined}
			class={cn(
				'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
				isHome ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
			)}
		>
			<Home class="w-6 h-6" />
			<span class="text-xs">Home</span>
		</a>

		<a
			href="/projects"
			aria-label="Projects"
			aria-current={isProjects ? 'page' : undefined}
			class={cn(
				'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
				isProjects ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
			)}
		>
			<Folder class="w-6 h-6" />
			<span class="text-xs">Projects</span>
		</a>

		<a
			href="/search"
			aria-label="Search"
			aria-current={isSearch ? 'page' : undefined}
			class={cn(
				'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
				isSearch ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
			)}
		>
			<Search class="w-6 h-6" />
			<span class="text-xs">Search</span>
		</a>

		<a
			href="/settings"
			aria-label="Settings"
			aria-current={isSettings ? 'page' : undefined}
			class={cn(
				'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
				isSettings ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
			)}
		>
			<Settings class="w-6 h-6" />
			<span class="text-xs">Settings</span>
		</a>
	</div>
</nav>
