<script lang="ts">
  import type { ViewingMode } from '$lib/viewing-modes';

  export let currentMode: ViewingMode;
  export let setViewingMode: (mode: ViewingMode) => void;
</script>

<div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-ink/70 border border-white/10 backdrop-blur-md rounded-full p-2">
  <button
    on:click={() => setViewingMode('individual')}
    class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
           {currentMode === 'individual'
             ? 'bg-chelsea-blue text-white'
             : 'bg-transparent text-gray-300 hover:bg-white/10 active:scale-95'}"
    aria-label="Individual view"
    aria-current={currentMode === 'individual' ? 'true' : undefined}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    <span class="hidden sm:inline">Individual</span>
  </button>
  <button
    on:click={() => setViewingMode('team')}
    class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
           {currentMode === 'team'
             ? 'bg-chelsea-blue text-white'
             : 'bg-transparent text-gray-300 hover:bg-white/10 active:scale-95'}"
    aria-label="Team view"
    aria-current={currentMode === 'team' ? 'true' : undefined}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    <span class="hidden sm:inline">All Team</span>
  </button>
  <button
    on:click={() => setViewingMode('formation')}
    class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
           {currentMode === 'formation'
             ? 'bg-chelsea-blue text-white'
             : 'bg-transparent text-gray-300 hover:bg-white/10 active:scale-95'}"
    aria-label="Formation view"
    aria-current={currentMode === 'formation' ? 'true' : undefined}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
    <span class="hidden sm:inline">Formation</span>
  </button>
</div>
