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

<nav class="fixed left-0 top-0 h-screen w-64 border-r bg-background hidden md:block">
	<div class="flex flex-col h-full">
		<!-- Logo/App title -->
		<div class="p-6 border-b">
			<h1 class="text-xl font-bold">Issue Tracker</h1>
		</div>

		<!-- Navigation items -->
		<div class="flex-1 p-4 space-y-1">
			<a
				href="/"
				aria-label="Home"
				aria-current={isHome ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
					isHome
						? 'bg-muted text-foreground font-medium'
						: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				)}
			>
				<Home class="w-5 h-5" />
				<span>Home</span>
			</a>

			<a
				href="/projects"
				aria-label="Projects"
				aria-current={isProjects ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
					isProjects
						? 'bg-muted text-foreground font-medium'
						: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				)}
			>
				<Folder class="w-5 h-5" />
				<span>Projects</span>
			</a>

			<a
				href="/search"
				aria-label="Search"
				aria-current={isSearch ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
					isSearch
						? 'bg-muted text-foreground font-medium'
						: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				)}
			>
				<Search class="w-5 h-5" />
				<span>Search</span>
			</a>

			<a
				href="/settings"
				aria-label="Settings"
				aria-current={isSettings ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
					isSettings
						? 'bg-muted text-foreground font-medium'
						: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
				)}
			>
				<Settings class="w-5 h-5" />
				<span>Settings</span>
			</a>
		</div>
	</div>
</nav>
