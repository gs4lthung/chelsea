<script lang="ts">
  import type { Player } from '$lib/players';
  import type { PlayerFormData } from '$lib/roster';
  import type { CountryFlag } from '$lib/flags';
  import { readIconFileAsDataUrl } from '$lib/image-utils';
  import PhotoEditor from './PhotoEditor.svelte';

  export let initial: Player | null = null;
  export let suggestedNumber: number | null = null;
  export let flags: CountryFlag[] = [];
  export let onSubmit: (data: PlayerFormData) => Promise<void>;
  export let onCancel: () => void;

  const POSITIONS = ['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW', 'Manager'];
  const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB, before the photo editor crops/resizes it

  const isEdit = initial !== null;

  let number: number | null = initial?.number ?? suggestedNumber ?? null;
  let firstName = initial?.firstName ?? '';
  let lastName = initial?.lastName.trim() ?? '';
  let position = initial?.position ?? 'ST';
  let isCaptain = initial?.isCaptain ?? false;
  let isSuspended = initial?.isSuspended ?? false;
  let photo = initial?.image ?? '';
  let error = '';
  let photoError = '';
  let isSaving = false;
  let editingFile: File | Blob | null = null;
  let imageUrl = '';
  let isLoadingUrl = false;

  let countryImage: string | null = initial?.countryImage ?? null;
  const initialMatch = flags.find((c) => c.image === countryImage);
  let countrySelection = initialMatch ? initialMatch.name : countryImage ? '__custom__' : '';
  let flagError = '';
  let isProcessingFlag = false;

  function handleCountrySelect(): void {
    if (countrySelection === '' ) {
      countryImage = null;
    } else if (countrySelection !== '__custom__') {
      countryImage = flags.find((c) => c.name === countrySelection)?.image ?? null;
    }
    // '__custom__' keeps whatever countryImage already is until a file is uploaded
  }

  async function handleCustomFlagChange(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    flagError = '';
    isProcessingFlag = true;
    try {
      countryImage = await readIconFileAsDataUrl(file);
    } catch (err) {
      flagError = err instanceof Error ? err.message : 'Could not process that image.';
    } finally {
      isProcessingFlag = false;
    }
  }

  const inputClass =
    'bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-white ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light';

  function handlePhotoChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      photoError = 'Photo is too large (max 8MB).';
      return;
    }

    photoError = '';
    editingFile = file;
  }

  async function handleLoadImageUrl(): Promise<void> {
    const url = imageUrl.trim();
    if (!url) return;

    photoError = '';
    isLoadingUrl = true;
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Could not load that image (${res.status}).`);
      }
      editingFile = await res.blob();
      imageUrl = '';
    } catch (err) {
      photoError = err instanceof Error ? err.message : 'Could not load that image.';
    } finally {
      isLoadingUrl = false;
    }
  }

  let isLoadingCurrentPhoto = false;

  /** Re-open the photo editor on the photo already set, instead of requiring a fresh upload. */
  async function handleEditCurrentPhoto(): Promise<void> {
    if (!photo) return;

    photoError = '';
    isLoadingCurrentPhoto = true;
    try {
      const res = await fetch(photo);
      if (!res.ok) throw new Error('Could not load the current photo.');
      editingFile = await res.blob();
    } catch (err) {
      photoError = err instanceof Error ? err.message : 'Could not load the current photo.';
    } finally {
      isLoadingCurrentPhoto = false;
    }
  }

  function handlePhotoEditorConfirm(dataUrl: string): void {
    photo = dataUrl;
    editingFile = null;
  }

  function handlePhotoEditorCancel(): void {
    editingFile = null;
  }

  async function handleSubmit(): Promise<void> {
    if (number === null || !Number.isInteger(number) || number < 0) {
      error = 'Enter a valid squad number.';
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      error = 'First and last name are required.';
      return;
    }
    if (!photo) {
      error = 'Add a photo for this player.';
      return;
    }
    error = '';
    isSaving = true;
    try {
      await onSubmit({
        number,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position,
        isCaptain,
        isSuspended,
        image: photo,
        countryImage,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not save this player.';
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="bg-ink-soft border border-white/10 rounded-xl p-6 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)]">
  <h2 class="player-name text-xl text-white mb-4">{isEdit ? 'Edit player' : 'Add player'}</h2>

  <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">
    <div class="flex items-center gap-4">
      <div
        class="w-20 h-20 rounded-lg bg-cover bg-center border border-white/15 flex-shrink-0 bg-black/30"
        style={photo ? `background-image: url('${photo}')` : ''}
      >
        {#if !photo}
          <div class="w-full h-full flex items-center justify-center text-gray-500 text-[10px] text-center px-1 leading-tight">
            No photo
          </div>
        {/if}
      </div>
      <div class="flex flex-col gap-1.5 flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <label
            class="inline-flex w-fit items-center gap-2 text-sm text-chelsea-blue-light hover:text-white
                   cursor-pointer transition-colors border border-white/15 rounded-lg px-3 py-1.5
                   focus-within:ring-2 focus-within:ring-chelsea-blue-light"
          >
            <input type="file" accept="image/*" class="hidden" on:change={handlePhotoChange} />
            {photo ? 'Change photo' : 'Upload photo'}
          </label>
          {#if photo}
            <button
              type="button"
              on:click={handleEditCurrentPhoto}
              disabled={isLoadingCurrentPhoto}
              class="text-sm text-chelsea-blue-light hover:text-white transition-colors disabled:opacity-50
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
            >
              {isLoadingCurrentPhoto ? 'Loading…' : 'Edit photo'}
            </button>
          {/if}
          <span class="text-xs text-gray-500">or</span>
          <div class="flex items-center gap-1.5 flex-1 min-w-[160px]">
            <input
              type="url"
              placeholder="Paste an image URL"
              bind:value={imageUrl}
              disabled={isLoadingUrl}
              on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLoadImageUrl())}
              class="flex-1 min-w-0 bg-black/30 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
            />
            <button
              type="button"
              on:click={handleLoadImageUrl}
              disabled={isLoadingUrl || !imageUrl.trim()}
              class="text-sm text-chelsea-blue-light hover:text-white transition-colors disabled:opacity-40
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded px-1"
            >
              {isLoadingUrl ? 'Loading…' : 'Load'}
            </button>
          </div>
        </div>
        <p class="text-[11px] text-gray-500">Crop and optionally remove the background after selecting.</p>
        {#if photoError}
          <p class="text-xs text-chelsea-red">{photoError}</p>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-sm text-gray-300">
        Squad number
        <input type="number" min="0" step="1" bind:value={number} class={inputClass} />
      </label>
      <label class="flex flex-col gap-1 text-sm text-gray-300">
        Position
        <select bind:value={position} class={inputClass}>
          {#each POSITIONS as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-sm text-gray-300">
        First name
        <input type="text" bind:value={firstName} class={inputClass} />
      </label>
      <label class="flex flex-col gap-1 text-sm text-gray-300">
        Last name
        <input type="text" bind:value={lastName} class={inputClass} />
      </label>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-sm text-gray-300">Country</span>
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-6 rounded-sm border border-white/15 bg-black/30 flex-shrink-0 bg-cover bg-center"
          style={countryImage ? `background-image: url('${countryImage}')` : ''}
        ></div>
        <select bind:value={countrySelection} on:change={handleCountrySelect} class={inputClass + ' flex-1'}>
          <option value="">No flag</option>
          {#each flags as flag (flag.id)}
            <option value={flag.name}>{flag.name}</option>
          {/each}
          <option value="__custom__">Custom…</option>
        </select>
      </div>
      {#if countrySelection === '__custom__'}
        <div class="flex items-center gap-2">
          <label
            class="inline-flex w-fit items-center gap-2 text-sm text-chelsea-blue-light hover:text-white
                   cursor-pointer transition-colors border border-white/15 rounded-lg px-3 py-1.5
                   focus-within:ring-2 focus-within:ring-chelsea-blue-light"
          >
            <input type="file" accept="image/*" class="hidden" on:change={handleCustomFlagChange} />
            {isProcessingFlag ? 'Processing…' : 'Upload flag'}
          </label>
        </div>
      {/if}
      {#if flagError}
        <p class="text-xs text-chelsea-red">{flagError}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          bind:checked={isCaptain}
          class="accent-chelsea-gold w-4 h-4 rounded
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
        />
        Captain
      </label>
      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          bind:checked={isSuspended}
          class="accent-chelsea-red w-4 h-4 rounded
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
        />
        Suspended
      </label>
    </div>

    {#if error}
      <p class="text-sm text-chelsea-red">{error}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        on:click={onCancel}
        class="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSaving}
        class="px-4 py-2 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
               active:scale-95 text-white transition-all duration-200 disabled:opacity-50
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add player'}
      </button>
    </div>
  </form>
</div>

{#if editingFile}
  <PhotoEditor
    file={editingFile}
    previewFirstName={firstName}
    previewLastName={lastName}
    previewNumber={number}
    onConfirm={handlePhotoEditorConfirm}
    onCancel={handlePhotoEditorCancel}
  />
{/if}
