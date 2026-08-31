<script lang="ts">
  import type { CountryFlag } from '$lib/flags';
  import { readIconFileAsDataUrl } from '$lib/image-utils';

  export let initial: CountryFlag | null = null;
  export let onSubmit: (data: { name: string; image: string }) => Promise<void>;
  export let onCancel: () => void;

  const isEdit = initial !== null;

  let name = initial?.name ?? '';
  let image = initial?.image ?? '';
  let error = '';
  let isProcessingImage = false;
  let isSaving = false;

  async function handleImageChange(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    error = '';
    isProcessingImage = true;
    try {
      image = await readIconFileAsDataUrl(file);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not process that image.';
    } finally {
      isProcessingImage = false;
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!name.trim()) {
      error = 'Enter a country name.';
      return;
    }
    if (!image) {
      error = 'Upload a flag image.';
      return;
    }
    error = '';
    isSaving = true;
    try {
      await onSubmit({ name: name.trim(), image });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not save this flag.';
    } finally {
      isSaving = false;
    }
  }
</script>

<form
  on:submit|preventDefault={handleSubmit}
  class="flex flex-col gap-3 bg-ink-soft border border-white/10 rounded-lg p-4"
>
  <div class="flex items-center gap-3 flex-wrap">
    <div
      class="w-9 h-6 rounded-sm border border-white/15 bg-black/30 flex-shrink-0 bg-cover bg-center"
      style={image ? `background-image: url('${image}')` : ''}
    ></div>
    <label
      class="inline-flex w-fit items-center gap-2 text-sm text-chelsea-blue-light hover:text-white
             cursor-pointer transition-colors border border-white/15 rounded-lg px-3 py-1.5
             focus-within:ring-2 focus-within:ring-chelsea-blue-light"
    >
      <input type="file" accept="image/*" class="hidden" on:change={handleImageChange} />
      {isProcessingImage ? 'Processing…' : image ? 'Change image' : 'Upload image'}
    </label>
    <input
      type="text"
      placeholder="Country name"
      bind:value={name}
      class="flex-1 min-w-[140px] bg-black/30 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-white
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
    />
  </div>

  {#if error}
    <p class="text-xs text-chelsea-red">{error}</p>
  {/if}

  <div class="flex justify-end gap-2">
    <button
      type="button"
      on:click={onCancel}
      class="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSaving}
      class="px-3 py-1.5 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
             active:scale-95 text-white transition-all duration-200 disabled:opacity-50
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add flag'}
    </button>
  </div>
</form>
