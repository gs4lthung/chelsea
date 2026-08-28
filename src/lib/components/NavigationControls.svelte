<script lang="ts">
  export let onPrev: () => void;
  export let onNext: () => void;
</script>

<nav class="flex gap-4 z-10 absolute bottom-4 left-1/2 transform -translate-x-1/2">
  <button
    on:click={onPrev}
    class="bg-chelsea-blue-dark/60 hover:bg-chelsea-blue/60 active:scale-95 px-4 py-2 rounded-lg shadow-md text-white
           border border-white/10
           transition-all duration-200
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    aria-label="Previous player"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  </button>

  <button
    on:click={onNext}
    class="bg-chelsea-blue-dark/60 hover:bg-chelsea-blue/60 active:scale-95 px-4 py-2 rounded-lg shadow-md text-white
           border border-white/10
           transition-all duration-200
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    aria-label="Next player"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </button>
</nav>

<div class="absolute bottom-20 text-gray-400 text-sm z-10 opacity-60">
  Use arrow keys • Press 1-3 for modes
</div>
