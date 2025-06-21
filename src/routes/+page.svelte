<script lang="ts">
  import players from "../chelsea.json";
  interface Player {
    image: string;
    firstName: string;
    lastName: string;
    id: number | string;
    countryImage: string;
    isCaptain?: boolean;
  }

  const resizePlayerName = (name: string) => {
    if (name.length > 20) {
      return "font-size: 24px";
    } else {
      return "font-size: 30px";
    }
  };

  const getBackground = (player: Player) =>
    `background-image: url('${player.image}'), url('https://www.thesun.co.uk/wp-content/uploads/2023/05/CHELSEA_BG_v1.jpg')`;
  let current = 0;

  function prev() {
    current = (current - 1 + players.length) % players.length;
  }

  function next() {
    current = (current + 1) % players.length;
  }
</script>

<div
  class="flex flex-col items-center justify-center h-screen bg-[url('https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ymx1ZSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D')]
     bg-cover bg-center bg-no-repeat"
>
  <div
    class="relative
       w-[350px] h-[500px]
       bg-cover bg-center bg-no-repeat
       rounded-lg border-blue-900 border-2 text-white
       shadow-[0_20px_50px_rgba(0,0,255,0.3)]
       transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
       hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] hover:border-blue-400"
    class:captain-glow={players[current].isCaptain}
    style={getBackground(players[current])}
  >
    <p
      class="player-name absolute bottom-2 left-4"
      style={resizePlayerName(
        players[current].firstName + players[current].lastName
      )}
    >
      {players[current].firstName}
      <span class="bg-white text-black px-2 rounded"
        >{players[current].lastName}</span
      >
    </p>
    <p
      class="player-number absolute bottom-2 right-2 text-2xl font-black text-white
           bg-gradient-to-br from-blue-800 to-blue-500
           px-3 py-1 rounded-xl shadow-[0_0_30px_rgba(0,0,255,0.6)]
           ring-2 ring-white/30 backdrop-blur-md tracking-wider"
    >
      {players[current].id}
    </p>

    <img
      src={players[current].countryImage}
      alt="National Team Logo"
      class="absolute top-4 right-4 w-12 h-8"
    />
  </div>
  <div class="flex gap-4 mt-6">
    <button
      on:click={prev}
      class="bg-blue-800/50 hover:bg-blue-600/50 px-4 py-2 rounded shadow text-white"
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
        class="lucide lucide-chevron-left-icon lucide-chevron-left"
        ><path d="m15 18-6-6 6-6" /></svg
      >
    </button>

    <button
      on:click={next}
      class="bg-blue-800/50 hover:bg-blue-600/50 px-4 py-2 rounded shadow text-white"
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
        class="lucide lucide-chevron-right-icon lucide-chevron-right"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </div>
</div>
