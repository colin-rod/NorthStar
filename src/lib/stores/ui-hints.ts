import { writable } from 'svelte/store';

import { browser } from '$app/environment';

const REORDER_HINT_KEY = 'reorderHintDismissed';

function createReorderHintStore() {
  const initialValue = browser ? localStorage.getItem(REORDER_HINT_KEY) === 'true' : false;
  const store = writable(initialValue);

  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem(REORDER_HINT_KEY, String(value));
    });
  }

  return store;
}

export const reorderHintDismissed = createReorderHintStore();

export function dismissReorderHint() {
  reorderHintDismissed.set(true);
}
