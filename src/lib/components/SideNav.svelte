<script lang="ts">
	/**
	 * SideNav Component - North Design System (Desktop)
	 *
	 * North Design Principles:
	 * - Clean sidebar with subtle border
	 * - Burnt orange accent for active nav items
	 * - Muted text for inactive items
	 * - Serif font for app wordmark
	 * - Minimal, clean appearance
	 */
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

<!-- North Design: Clean sidebar with subtle styling -->
<nav class="fixed left-0 top-0 h-screen w-64 border-r border-border-divider bg-surface hidden md:block">
	<div class="flex flex-col h-full">
		<!-- Logo/App title with serif font per North spec -->
		<div class="p-6 border-b border-border-divider">
			<h1 class="font-accent text-page-title">North</h1>
		</div>

		<!-- Navigation items -->
		<div class="flex-1 p-4 space-y-1">
			<a
				href="/"
				aria-label="Home"
				aria-current={isHome ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors',
					isHome
						? 'bg-primary-tint text-primary font-medium'
						: 'text-foreground-muted hover:bg-surface-subtle hover:text-foreground'
				)}
			>
				<Home class="w-5 h-5" />
				<span class="text-body">Home</span>
			</a>

			<a
				href="/projects"
				aria-label="Projects"
				aria-current={isProjects ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors',
					isProjects
						? 'bg-primary-tint text-primary font-medium'
						: 'text-foreground-muted hover:bg-surface-subtle hover:text-foreground'
				)}
			>
				<Folder class="w-5 h-5" />
				<span class="text-body">Projects</span>
			</a>

			<a
				href="/search"
				aria-label="Search"
				aria-current={isSearch ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors',
					isSearch
						? 'bg-primary-tint text-primary font-medium'
						: 'text-foreground-muted hover:bg-surface-subtle hover:text-foreground'
				)}
			>
				<Search class="w-5 h-5" />
				<span class="text-body">Search</span>
			</a>

			<a
				href="/settings"
				aria-label="Settings"
				aria-current={isSettings ? 'page' : undefined}
				class={cn(
					'flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors',
					isSettings
						? 'bg-primary-tint text-primary font-medium'
						: 'text-foreground-muted hover:bg-surface-subtle hover:text-foreground'
				)}
			>
				<Settings class="w-5 h-5" />
				<span class="text-body">Settings</span>
			</a>
		</div>
	</div>
</nav>
