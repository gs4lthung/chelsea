<script lang="ts">
  import { onDestroy, tick } from 'svelte';

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
  // 2x the frame's max zoomed-in display size, so cards stay sharp on retina
  // screens. Kept as a lossless PNG end-to-end — a JPEG pass here introduced
  // compression-block seams that the background-removal model would bake
  // into the cutout as visible lines on the subject.
  const EXPORT_WIDTH = 960;
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

  // Manual touch-up brush, for cleaning up spots the automatic background
  // removal missed (or restoring bits it took that shouldn't have gone).
  let aiRemovedDataUrl = '';
  let canvasEl: HTMLCanvasElement;
  let workingCtx: CanvasRenderingContext2D | null = null;
  let originalForRestore: HTMLCanvasElement | null = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let brushMode: 'erase' | 'restore' = 'erase';
  let brushSize = 24;
  let isBrushing = false;
  let hasBrushEdits = false;
  let lastPaintPoint: { x: number; y: number } | null = null;

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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const exportScale = EXPORT_WIDTH / FRAME_WIDTH;
    const drawW = naturalWidth * zoom * exportScale;
    const drawH = naturalHeight * zoom * exportScale;
    const drawX = EXPORT_WIDTH / 2 - drawW / 2 + offsetX * exportScale;
    const drawY = exportHeight / 2 - drawH / 2 + offsetY * exportScale;
    ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
    return canvas.toDataURL('image/png');
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

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  /** (Re)draws the given cutout onto the visible working canvas, discarding any brush edits. */
  function drawMaskOntoCanvas(img: HTMLImageElement): void {
    if (!workingCtx) return;
    workingCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    workingCtx.imageSmoothingEnabled = true;
    workingCtx.imageSmoothingQuality = 'high';
    workingCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    hasBrushEdits = false;
  }

  async function handleRemoveBackground(): Promise<void> {
    isProcessingBg = true;
    bgError = '';
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(croppedDataUrl);
      aiRemovedDataUrl = await blobToDataUrl(blob);

      const [maskImg, originalImg] = await Promise.all([
        loadImage(aiRemovedDataUrl),
        loadImage(croppedDataUrl),
      ]);
      canvasWidth = maskImg.naturalWidth;
      canvasHeight = maskImg.naturalHeight;
      bgRemoved = true;

      // The canvas only exists in the DOM once bgRemoved flips the template
      // over to it, so wait a tick before grabbing its context.
      await tick();
      workingCtx = canvasEl.getContext('2d');
      if (!workingCtx) throw new Error('Canvas is not supported in this browser');
      drawMaskOntoCanvas(maskImg);

      originalForRestore = document.createElement('canvas');
      originalForRestore.width = canvasWidth;
      originalForRestore.height = canvasHeight;
      const restoreCtx = originalForRestore.getContext('2d');
      if (restoreCtx) {
        restoreCtx.imageSmoothingEnabled = true;
        restoreCtx.imageSmoothingQuality = 'high';
        restoreCtx.drawImage(originalImg, 0, 0, canvasWidth, canvasHeight);
      }
    } catch (err) {
      bgError =
        err instanceof Error
          ? `Could not remove the background: ${err.message}`
          : 'Could not remove the background.';
    } finally {
      isProcessingBg = false;
    }
  }

  /** Reverts brush touch-ups only, back to the fresh AI cutout. */
  async function handleResetTouchUps(): Promise<void> {
    if (!aiRemovedDataUrl) return;
    drawMaskOntoCanvas(await loadImage(aiRemovedDataUrl));
  }

  function handleUndoBackgroundRemoval(): void {
    finalDataUrl = croppedDataUrl;
    bgRemoved = false;
    bgError = '';
    aiRemovedDataUrl = '';
    workingCtx = null;
    originalForRestore = null;
    hasBrushEdits = false;
  }

  function getCanvasPoint(e: PointerEvent): { x: number; y: number } {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasWidth,
      y: ((e.clientY - rect.top) / rect.height) * canvasHeight,
    };
  }

  function paintAt(x: number, y: number): void {
    if (!workingCtx) return;

    if (brushMode === 'erase') {
      // A soft-edged gradient reads more natural than a hard-edged cutout.
      const gradient = workingCtx.createRadialGradient(x, y, 0, x, y, brushSize);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      workingCtx.save();
      workingCtx.globalCompositeOperation = 'destination-out';
      workingCtx.fillStyle = gradient;
      workingCtx.beginPath();
      workingCtx.arc(x, y, brushSize, 0, Math.PI * 2);
      workingCtx.fill();
      workingCtx.restore();
    } else if (originalForRestore) {
      workingCtx.save();
      workingCtx.beginPath();
      workingCtx.arc(x, y, brushSize, 0, Math.PI * 2);
      workingCtx.clip();
      workingCtx.drawImage(originalForRestore, 0, 0);
      workingCtx.restore();
    }

    hasBrushEdits = true;
  }

  function paintStroke(from: { x: number; y: number } | null, to: { x: number; y: number }): void {
    if (!from) {
      paintAt(to.x, to.y);
      return;
    }
    // Fill in the gap between two points so a fast drag doesn't leave dots.
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (brushSize / 3)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      paintAt(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    }
  }

  function handleBrushDown(e: PointerEvent): void {
    isBrushing = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const point = getCanvasPoint(e);
    paintStroke(null, point);
    lastPaintPoint = point;
  }

  function handleBrushMove(e: PointerEvent): void {
    if (!isBrushing) return;
    const point = getCanvasPoint(e);
    paintStroke(lastPaintPoint, point);
    lastPaintPoint = point;
  }

  function handleBrushUp(): void {
    isBrushing = false;
    lastPaintPoint = null;
  }

  function handleConfirm(): void {
    const dataUrl = bgRemoved && canvasEl ? canvasEl.toDataURL('image/png') : finalDataUrl;
    onConfirm(dataUrl);
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
        {#if bgRemoved}
          <canvas
            bind:this={canvasEl}
            width={canvasWidth}
            height={canvasHeight}
            class="absolute inset-0 w-full h-full object-cover touch-none {brushMode === 'erase' ? 'cursor-cell' : 'cursor-copy'}"
            on:pointerdown={handleBrushDown}
            on:pointermove={handleBrushMove}
            on:pointerup={handleBrushUp}
            on:pointercancel={handleBrushUp}
          ></canvas>
        {:else if finalDataUrl}
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

      {#if bgRemoved}
        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center gap-2 text-xs text-gray-300">
            <div class="flex rounded-lg overflow-hidden border border-white/10">
              <button
                type="button"
                on:click={() => (brushMode = 'erase')}
                aria-pressed={brushMode === 'erase'}
                class="px-3 py-1.5 transition-colors {brushMode === 'erase' ? 'bg-chelsea-blue text-white' : 'bg-white/5 hover:bg-white/10'}"
              >
                Erase
              </button>
              <button
                type="button"
                on:click={() => (brushMode = 'restore')}
                aria-pressed={brushMode === 'restore'}
                class="px-3 py-1.5 transition-colors {brushMode === 'restore' ? 'bg-chelsea-blue text-white' : 'bg-white/5 hover:bg-white/10'}"
              >
                Restore
              </button>
            </div>
            <label class="flex items-center gap-1.5">
              Size
              <input
                type="range"
                min="6"
                max="60"
                step="1"
                bind:value={brushSize}
                class="w-20 accent-chelsea-blue"
              />
            </label>
          </div>
          <p class="text-[11px] text-gray-500 text-center">
            {brushMode === 'erase'
              ? 'Paint over leftover background to remove it.'
              : 'Paint to bring back photo that got erased.'}
          </p>
        </div>
      {/if}

      <div class="flex justify-center gap-4">
        {#if bgRemoved}
          {#if hasBrushEdits}
            <button
              type="button"
              on:click={handleResetTouchUps}
              class="text-sm text-gray-400 hover:text-white transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chelsea-blue-light rounded"
            >
              Reset touch-ups
            </button>
          {/if}
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
