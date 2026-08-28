<script lang="ts">
  import { onDestroy } from 'svelte';

  /** A local file selection or an image fetched via the URL-import flow. */
  export let file: File | Blob;
  /** width / height */
  export let aspect = 7 / 10;
  export let onConfirm: (dataUrl: string) => void;
  export let onCancel: () => void;
  /** Shown on the preview stage so it matches the real player card. */
  export let previewFirstName = '';
  export let previewLastName = '';
  export let previewNumber: number | null = null;

  const FRAME_WIDTH = 280;
  const frameHeight = Math.round(FRAME_WIDTH / aspect);
  const EXPORT_WIDTH = 480;
  const exportHeight = Math.round(EXPORT_WIDTH / aspect);

  let stage: 'crop' | 'preview' = 'crop';
  let imgEl: HTMLImageElement;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let minZoom = 1;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let offsetStart = { x: 0, y: 0 };

  let croppedDataUrl = '';
  let finalDataUrl = '';
  let bgRemoved = false;
  let isProcessingBg = false;
  let bgError = '';

  const objectUrls: string[] = [];
  function trackedObjectUrl(f: File | Blob): string {
    const url = URL.createObjectURL(f);
    objectUrls.push(url);
    return url;
  }
  onDestroy(() => objectUrls.forEach((u) => URL.revokeObjectURL(u)));

  const sourceUrl = trackedObjectUrl(file);

  function handleImgLoad(): void {
    naturalWidth = imgEl.naturalWidth;
    naturalHeight = imgEl.naturalHeight;
    const coverW = FRAME_WIDTH / naturalWidth;
    const coverH = frameHeight / naturalHeight;
    minZoom = Math.max(coverW, coverH);
    zoom = minZoom;
    offsetX = 0;
    offsetY = 0;
  }

  function clampOffsets(): void {
    const scaledW = naturalWidth * zoom;
    const scaledH = naturalHeight * zoom;
    const maxX = Math.max(0, (scaledW - FRAME_WIDTH) / 2);
    const maxY = Math.max(0, (scaledH - frameHeight) / 2);
    offsetX = Math.min(maxX, Math.max(-maxX, offsetX));
    offsetY = Math.min(maxY, Math.max(-maxY, offsetY));
  }

  function handlePointerDown(e: PointerEvent): void {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    offsetStart = { x: offsetX, y: offsetY };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent): void {
    if (!dragging) return;
    offsetX = offsetStart.x + (e.clientX - dragStart.x);
    offsetY = offsetStart.y + (e.clientY - dragStart.y);
    clampOffsets();
  }

  function handlePointerUp(): void {
    dragging = false;
  }

  function handleZoomInput(): void {
    clampOffsets();
  }

  function exportCrop(): string {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const exportScale = EXPORT_WIDTH / FRAME_WIDTH;
    const drawW = naturalWidth * zoom * exportScale;
    const drawH = naturalHeight * zoom * exportScale;
    const drawX = EXPORT_WIDTH / 2 - drawW / 2 + offsetX * exportScale;
    const drawY = exportHeight / 2 - drawH / 2 + offsetY * exportScale;
    ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  function handleCropNext(): void {
    croppedDataUrl = exportCrop();
    finalDataUrl = croppedDataUrl;
    bgRemoved = false;
    bgError = '';
    stage = 'preview';
  }

  function handleBackToCrop(): void {
    stage = 'crop';
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read processed image'));
      reader.readAsDataURL(blob);
    });
  }

  async function handleRemoveBackground(): Promise<void> {
    isProcessingBg = true;
    bgError = '';
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(croppedDataUrl);
      finalDataUrl = await blobToDataUrl(blob);
      bgRemoved = true;
    } catch (err) {
      bgError =
        err instanceof Error
          ? `Could not remove the background: ${err.message}`
          : 'Could not remove the background.';
    } finally {
      isProcessingBg = false;
    }
  }

  function handleUndoBackgroundRemoval(): void {
    finalDataUrl = croppedDataUrl;
    bgRemoved = false;
    bgError = '';
  }

  function handleConfirm(): void {
    onConfirm(finalDataUrl);
  }
</script>

<div
  class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink/85 backdrop-blur-sm"
  role="presentation"
>
  <div
    class="w-full max-w-sm bg-ink-soft border border-white/10 rounded-xl p-6
           shadow-[0_30px_70px_-16px_rgba(0,0,0,0.7)] flex flex-col gap-4"
    role="dialog"
    aria-modal="true"
    aria-label="Edit photo"
  >
    {#if stage === 'crop'}
      <h3 class="player-name text-lg text-white">Position photo</h3>
      <p class="text-xs text-gray-400 -mt-2">Drag to reposition, use the slider to zoom.</p>

      <div
        class="relative mx-auto overflow-hidden rounded-xl border border-white/10 bg-black/40 touch-none cursor-move select-none"
        style="width: {FRAME_WIDTH}px; height: {frameHeight}px;"
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointercancel={handlePointerUp}
      >
        <img
          bind:this={imgEl}
          src={sourceUrl}
          alt=""
          draggable="false"
          on:load={handleImgLoad}
          class="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
          style="width: {naturalWidth * zoom}px; height: {naturalHeight * zoom}px;
                 transform: translate(calc(-50% + {offsetX}px), calc(-50% + {offsetY}px));"
        />

        <!-- Center guidelines, so it's easy to line the player up in the middle -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-white/60 shadow-[0_0_2px_rgba(0,0,0,0.8)]"></div>
          <div class="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/60 shadow-[0_0_2px_rgba(0,0,0,0.8)]"></div>
        </div>
      </div>

      <label class="flex items-center gap-2 text-xs text-gray-400">
        Zoom
        <input
          type="range"
          min={minZoom}
          max={minZoom * 4}
          step="0.01"
          bind:value={zoom}
          on:input={handleZoomInput}
          class="flex-1 accent-chelsea-blue"
        />
      </label>

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
          type="button"
          on:click={handleCropNext}
          disabled={!naturalWidth}
          class="px-4 py-2 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
                 active:scale-95 text-white transition-all duration-200 disabled:opacity-50
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Next
        </button>
      </div>
    {:else}
      <h3 class="player-name text-lg text-white">Preview</h3>

      <p class="text-xs text-gray-400 -mt-2">This is exactly how the card will look.</p>

      <!-- Mirrors the real player card: rounded-xl border, shadow, bottom scrim, name/number chrome -->
      <div
        class="relative mx-auto rounded-xl border border-white/10 overflow-hidden
               shadow-[0_24px_50px_-12px_rgba(10,20,50,0.55)] text-white"
        style="width: {FRAME_WIDTH}px; height: {frameHeight}px;
               background-image:
                 linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%),
                 linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%);
               background-size: 16px 16px;
               background-position: 0 0, 0 8px, 8px -8px, -8px 0;
               background-color: #1a1a1a;"
      >
        {#if finalDataUrl}
          <img src={finalDataUrl} alt="Preview" class="absolute inset-0 w-full h-full object-cover" />
        {/if}

        <div
          class="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl
                 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent pointer-events-none"
        ></div>

        {#if previewFirstName || previewLastName}
          <p class="player-name absolute bottom-2 left-3 z-10 text-lg">
            {previewFirstName}
            <span class="bg-white/95 text-ink px-1.5 rounded">{previewLastName}</span>
          </p>
        {/if}

        {#if previewNumber !== null}
          <p
            class="player-number absolute bottom-2 right-2 z-10 text-base font-bold text-white
                   bg-gradient-to-br from-chelsea-blue to-chelsea-blue-dark
                   px-2 py-0.5 rounded-lg ring-1 ring-white/25 backdrop-blur-md"
          >
            {previewNumber}
          </p>
        {/if}

        {#if isProcessingBg}
          <div class="absolute inset-0 bg-ink/70 flex items-center justify-center">
            <div class="w-8 h-8 border-2 border-chelsea-blue-light border-t-transparent rounded-full animate-spin"></div>
          </div>
        {/if}
      </div>

      {#if bgError}
        <p class="text-xs text-chelsea-red text-center">{bgError}</p>
      {/if}

      <div class="flex justify-center">
        {#if bgRemoved}
          <button
            type="button"
            on:click={handleUndoBackgroundRemoval}
            class="text-sm text-chelsea-blue-light hover:text-white transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
          >
            Undo background removal
          </button>
        {:else}
          <button
            type="button"
            on:click={handleRemoveBackground}
            disabled={isProcessingBg}
            class="text-sm text-chelsea-blue-light hover:text-white transition-colors disabled:opacity-50
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
          >
            {isProcessingBg ? 'Removing background…' : 'Remove background'}
          </button>
        {/if}
      </div>

      <div class="flex justify-between gap-2 pt-2">
        <button
          type="button"
          on:click={handleBackToCrop}
          class="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
        >
          Back
        </button>
        <div class="flex gap-2">
          <button
            type="button"
            on:click={onCancel}
            class="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light"
          >
            Cancel
          </button>
          <button
            type="button"
            on:click={handleConfirm}
            class="px-4 py-2 rounded-lg text-sm font-medium bg-chelsea-blue hover:bg-chelsea-blue-light
                   active:scale-95 text-white transition-all duration-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Use this photo
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
