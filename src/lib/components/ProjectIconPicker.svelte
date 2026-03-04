<script lang="ts">
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { PROJECT_COLORS, getProjectColor, type ProjectColor } from '$lib/utils/project-colors';
  import {
    PROJECT_ICONS,
    getProjectIcon,
    type ProjectIconKey,
    type LucideIcon,
  } from '$lib/utils/project-icons';

  interface Props {
    color: string | null;
    icon: string | null;
    onColorChange: (color: ProjectColor) => void;
    onIconChange: (icon: ProjectIconKey) => void;
    size?: 'sm' | 'md';
  }

  let { color, icon, onColorChange, onIconChange, size = 'md' }: Props = $props();

  let open = $state(false);

  let activeColor = $derived(getProjectColor(color));
  let ActiveIcon = $derived(getProjectIcon(icon));

  const colorKeys = Object.keys(PROJECT_COLORS) as ProjectColor[];
  const iconEntries = Object.entries(PROJECT_ICONS) as [ProjectIconKey, LucideIcon][];

  const avatarSize = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 12 : 16;
</script>

<Popover bind:open>
  <PopoverTrigger>
    <button
      type="button"
      class="{avatarSize} rounded-md flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity shrink-0 {activeColor.bg}"
      title="Change project color and icon"
    >
      {#key icon}
        <ActiveIcon size={iconSize} class="text-white" />
      {/key}
    </button>
  </PopoverTrigger>
  <PopoverContent class="w-64 p-3" align="start">
    <div class="space-y-3">
      <!-- Color palette -->
      <div>
        <p class="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Color</p>
        <div class="flex flex-wrap gap-2">
          {#each colorKeys as colorKey}
            {@const c = PROJECT_COLORS[colorKey]}
            <button
              type="button"
              class="h-6 w-6 rounded-full {c.bg} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring {colorKey ===
              color
                ? 'ring-2 ring-offset-1 ring-foreground scale-110'
                : ''}"
              title={colorKey}
              onclick={() => {
                onColorChange(colorKey);
              }}
            ></button>
          {/each}
        </div>
      </div>

      <!-- Icon grid -->
      <div>
        <p class="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Icon</p>
        <div class="grid grid-cols-8 gap-1">
          {#each iconEntries as [iconKey, IconComponent]}
            <button
              type="button"
              class="h-8 w-8 rounded flex items-center justify-center transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring {iconKey ===
              icon
                ? 'bg-muted ring-1 ring-ring'
                : ''}"
              title={iconKey.replace(/_/g, ' ')}
              onclick={() => {
                onIconChange(iconKey);
                open = false;
              }}
            >
              <IconComponent size={14} class="text-foreground" />
            </button>
          {/each}
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
