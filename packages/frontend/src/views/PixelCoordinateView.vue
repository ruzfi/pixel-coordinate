<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { ResponseFull } from "@caido/sdk-frontend";

import type { FrontendSDK } from "../types";

const props = defineProps<{
  sdk: FrontendSDK;
  response: ResponseFull;
}>();

type Point = { x: number; y: number };

const imageUrl = ref("");
const contentType = ref("");
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const loading = ref(true);
const errorMsg = ref("");

const hoverPx = ref<Point | null>(null);
const hoverPct = ref<Point | null>(null);
const frozenPx = ref<Point | null>(null);
const frozenPct = ref<Point | null>(null);

const imgRef = ref<HTMLImageElement | null>(null);

const isFrozen = computed(() => frozenPx.value !== null);
const activePx = computed(() => frozenPx.value ?? hoverPx.value);
const activePct = computed(() => frozenPct.value ?? hoverPct.value);

async function load() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const data = await props.sdk.backend.getImageData(props.response.id);
    if (!data) {
      errorMsg.value = "No image data available for this response.";
      return;
    }

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: data.contentType });

    imageUrl.value = URL.createObjectURL(blob);
    contentType.value = data.contentType;
  } catch (err) {
    errorMsg.value = `Error loading image: ${
      err instanceof Error ? err.message : String(err)
    }`;
  } finally {
    loading.value = false;
  }
}

function onImageLoad() {
  const img = imgRef.value;
  if (!img) return;
  naturalWidth.value = img.naturalWidth;
  naturalHeight.value = img.naturalHeight;
}

function toPixel(e: MouseEvent): Point {
  const img = imgRef.value;
  if (!img || naturalWidth.value === 0 || naturalHeight.value === 0) {
    return { x: 0, y: 0 };
  }
  const rect = img.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { x: 0, y: 0 };
  }
  const scaleX = naturalWidth.value / rect.width;
  const scaleY = naturalHeight.value / rect.height;
  const x = clamp(
    Math.floor((e.clientX - rect.left) * scaleX),
    0,
    naturalWidth.value - 1,
  );
  const y = clamp(
    Math.floor((e.clientY - rect.top) * scaleY),
    0,
    naturalHeight.value - 1,
  );
  return { x, y };
}

function toPercent(e: MouseEvent): Point {
  const img = imgRef.value;
  if (!img) return { x: 0, y: 0 };
  const rect = img.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function onMouseMove(e: MouseEvent) {
  if (frozenPx.value) return;
  hoverPx.value = toPixel(e);
  hoverPct.value = toPercent(e);
}

function onMouseLeave() {
  if (frozenPx.value) return;
  hoverPx.value = null;
  hoverPct.value = null;
}

function onClickImage(e: MouseEvent) {
  const p = toPixel(e);
  frozenPx.value = p;
  frozenPct.value = toPercent(e);
  hoverPx.value = p;
  hoverPct.value = frozenPct.value;
}

function clear() {
  frozenPx.value = null;
  frozenPct.value = null;
  hoverPx.value = null;
  hoverPct.value = null;
}

function copy() {
  const p = activePx.value;
  if (!p) return;
  const text = `${p.x}, ${p.y}`;
  navigator.clipboard
    ?.writeText(text)
    .then(() => {
      props.sdk.window?.showToast?.(`Copied ${text}`, { variant: "success" });
    })
    .catch(() => {
      props.sdk.window?.showToast?.("Failed to copy", { variant: "error" });
    });
}

const crosshairStyle = computed(() => {
  const p = activePct.value;
  if (!p) return null;
  return {
    left: `${clamp(p.x, 0, 1) * 100}%`,
    top: `${clamp(p.y, 0, 1) * 100}%`,
  };
});

onMounted(load);
onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
});
</script>

<template>
  <div class="pc-root">
    <!-- Toolbar -->
    <div class="pc-toolbar">
      <div class="pc-readout">
        <template v-if="activePx">
          <span class="pc-coord">
            X: {{ activePx.x }} &nbsp; Y: {{ activePx.y }}
          </span>
          <span v-if="isFrozen" class="pc-badge">Frozen</span>
        </template>
        <span v-else class="pc-hint">Hover the image to see coordinates</span>
      </div>

      <div class="pc-meta" v-if="naturalWidth > 0">
        {{ naturalWidth }} × {{ naturalHeight }}px
        <span class="pc-type">{{ contentType }}</span>
      </div>

      <div class="pc-actions">
        <button
          class="pc-btn"
          :disabled="!activePx"
          title="Copy coordinates to clipboard"
          @click="copy"
        >
          Copy
        </button>
        <button
          class="pc-btn pc-btn-primary"
          :disabled="!isFrozen"
          title="Clear frozen coordinate"
          @click="clear"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Image area -->
    <div class="pc-stage">
      <div v-if="loading" class="pc-message">Loading image…</div>
      <div v-else-if="errorMsg" class="pc-message pc-error">{{ errorMsg }}</div>

      <div v-show="!loading && !errorMsg" class="pc-image-wrap">
        <img
          ref="imgRef"
          class="pc-image"
          :src="imageUrl"
          alt="Response image"
          draggable="false"
          @load="onImageLoad"
          @mousemove="onMouseMove"
          @mouseleave="onMouseLeave"
          @click="onClickImage"
        />

        <!-- Crosshair -->
        <div v-if="activePct" class="pc-crosshair" :style="crosshairStyle">
          <span class="pc-crosshair-v" />
          <span class="pc-crosshair-h" />
          <span class="pc-crosshair-dot" />
          <span class="pc-crosshair-label">
            {{ activePx?.x }}, {{ activePx?.y }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f1115;
  color: #e5e7eb;
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
  font-size: 13px;
}

.pc-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2f3a;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.pc-readout {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pc-coord {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.pc-badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  background: #1d4ed8;
  color: #ffffff;
  white-space: nowrap;
}

.pc-hint {
  color: #9ca3af;
  white-space: nowrap;
}

.pc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
  white-space: nowrap;
}

.pc-type {
  color: #6b7280;
}

.pc-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.pc-btn {
  padding: 5px 12px;
  border: 1px solid #2a2f3a;
  border-radius: 6px;
  background: #1a1d23;
  color: #d1d5db;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
}

.pc-btn:hover:not(:disabled) {
  background: #23262d;
  border-color: #3b4150;
}

.pc-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.pc-btn-primary {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

.pc-btn-primary:hover:not(:disabled) {
  background: #1e40af;
  border-color: #1e40af;
}

.pc-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 12px;
}

.pc-message {
  color: #9ca3af;
}

.pc-error {
  color: #f87171;
}

.pc-image-wrap {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.pc-image {
  max-width: 100%;
  max-height: calc(100vh - 160px);
  height: auto;
  cursor: crosshair;
  user-select: none;
  -webkit-user-select: none;
}

.pc-crosshair {
  position: absolute;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.pc-crosshair-v {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1px;
  height: 17px;
  transform: translate(-50%, -50%);
  background: #22d3ee;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
}

.pc-crosshair-h {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 17px;
  height: 1px;
  transform: translate(-50%, -50%);
  background: #22d3ee;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
}

.pc-crosshair-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 3px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.7);
}

.pc-crosshair-label {
  position: absolute;
  left: 50%;
  top: -8px;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #22d3ee;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 11px;
  line-height: 1.5;
}
</style>
