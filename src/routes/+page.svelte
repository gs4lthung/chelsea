<script lang="ts">
  import { onMount } from "svelte";
  import players from "../chelsea.json";
  import { fade, fly } from "svelte/transition";

  interface Player {
    image: string;
    firstName: string;
    lastName: string;
    id: number | string;
    countryImage: string;
    isCaptain?: boolean;
    isSuspended?: boolean;
  }

  let current = 0;
  let canAction = true;
  let imageLoaded = false;
  let currentImage = "";

  const resizePlayerName = (name: string) =>
    name.length > 20 ? "font-size: 24px" : "font-size: 30px";

  const getBackground = (image: string) =>
    `background-image: url('${image}'), url('https://www.thesun.co.uk/wp-content/uploads/2023/05/CHELSEA_BG_v1.jpg')`;

  function preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setTimeout(() => resolve(), 500); // 2 seconds delay
      };
    });
  }

  async function updateImage() {
    imageLoaded = false;
    await preloadImage(players[current].image);
    currentImage = players[current].image;
    imageLoaded = true;
  }

  async function prev() {
    if (!canAction || !imageLoaded) return;
    canAction = false;
    current = (current - 1 + players.length) % players.length;
    await updateImage();
    setTimeout(() => (canAction = true), 1000);
  }

  async function next() {
    if (!canAction || !imageLoaded) return;
    canAction = false;
    current = (current + 1) % players.length;
    await updateImage();
    setTimeout(() => (canAction = true), 1000);
  }

  onMount(() => {
    currentImage = players[current].image;
    updateImage();
  });
</script>

<div
  class="flex flex-col items-center justify-center h-screen relative overflow-hidden
         bg-[url('https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000')] bg-cover bg-center"
>
  <div class="absolute top-0 left-0 w-full h-full bg-black/50 z-0"></div>

  <div
    class="absolute bottom-0 right-0 text-gray-400 text-xs p-2 hover:text-blue-300 hover:underline z-10"
  >
    <a href="https://www.facebook.com/hung.041203" target="_blank"
      >Credit: Lâm Tiên Hưng</a
    >
  </div>
  {#if imageLoaded}
    <div
      class="relative flex flex-col items-center justify-center
             w-[350px] h-[500px]
             bg-cover bg-center bg-no-repeat
             rounded-lg border-blue-900 border-2 text-white
             shadow-[0_20px_50px_rgba(0,0,255,0.3)]
             hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] hover:border-blue-400
             z-10
              transition-all duration-300 ease-in-out
             "
      class:captain-glow={players[current].isCaptain}
      class:suspended-glow={players[current].isSuspended}
      style={getBackground(currentImage)}
      transition:fly={{ y: 50, duration: 500, easing: (t) => t * t }}
    >
      <p
        class="player-name absolute bottom-2 left-4"
        style={resizePlayerName(
          players[current].firstName + players[current].lastName
        )}
        transition:fade={{ duration: 500 }}
      >
        {players[current].firstName}
        <span class="bg-white text-black px-2 rounded">
          {players[current].lastName}
        </span>
      </p>

      <p
        class="player-number absolute bottom-2 right-2 text-2xl font-black text-white
               bg-gradient-to-br from-blue-800 to-blue-500
               px-3 py-1 rounded-xl shadow-[0_0_30px_rgba(0,0,255,0.6)]
               ring-2 ring-white/30 backdrop-blur-md tracking-wider"
        transition:fade={{ duration: 500 }}
      >
        {players[current].id}
      </p>

      <img
        src={players[current].countryImage}
        alt="National Team Logo"
        class="absolute top-4 right-4 w-12 h-8"
        style="filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))"
        transition:fade={{ duration: 500 }}
      />
    </div>
  {/if}

  <!-- Navigation -->
  <div
    class="flex gap-4 mt-6 z-10 absolute bottom-4 left-1/2 transform -translate-x-1/2"
  >
    <button
      on:click={prev}
      class="bg-blue-800/50 hover:bg-blue-600/50 px-4 py-2 rounded shadow text-white"
      aria-label="Previous player"
      disabled={!canAction || !imageLoaded}
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
      on:click={next}
      class="bg-blue-800/50 hover:bg-blue-600/50 px-4 py-2 rounded shadow text-white"
      aria-label="Next player"
      disabled={!canAction || !imageLoaded}
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
  </div>
</div>
