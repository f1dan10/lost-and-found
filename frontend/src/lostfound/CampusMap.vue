<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, onUnmounted, ref, watch } from "vue";

/** One building on the map, with how many open found and lost reports are there, already filtered by what is shown. */
export interface MapTile {
  place: string;
  name: string;
  latitude: number;
  longitude: number;
  found: number;
  lost: number;
}

/**
 * A campus map with one marker per building. A building with reports shows a pill with its found count (blue, pin)
 * and lost count (orange, magnifier); an empty one is a small grey dot. Choosing a marker selects the building.
 * The base map is Esri's Light Gray Canvas, quiet so the pins stand out.
 */
const props = defineProps<{ tiles: MapTile[]; selected: string | null }>();
const emit = defineEmits<{ select: [place: string] }>();
const element = ref<HTMLElement | null>(null);
let map: L.Map | undefined;
let markers: L.LayerGroup | undefined;
let fitted = false;
/** What the markers show now, so a poll that changed nothing doesn't redraw them and take a keyboard user's focus away. */
let drawn = "";

const PIN = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/></svg>';
const LENS = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0"/><path d="m20 20-3.5-3.5"/></svg>';

/** The zoom at which pills start showing building names. */
const NAMES_FROM_ZOOM = 17;

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function describe(tile: MapTile) {
  return `${tile.name}: ${tile.found} found, ${tile.lost} lost`;
}

function draw() {
  if (!map || !markers) return;
  // Zoomed out, names would cover each other, so a pill shows only its counts; the name is in its label and title.
  const named = map.getZoom() >= NAMES_FROM_ZOOM;
  const showing = JSON.stringify([props.tiles, props.selected, named]);
  if (showing === drawn) return;
  drawn = showing;
  markers.clearLayers();
  for (const tile of props.tiles) {
    const on = tile.place === props.selected ? " on" : "";
    const busy = tile.found + tile.lost > 0;
    const html = busy
      ? `<span class="lf-pill${on}">${named ? `<span class="lf-name">${escape(tile.name)}</span>` : ""}` +
        (tile.found ? `<span class="lf-count lf-found">${PIN}${tile.found}</span>` : "") +
        (tile.lost ? `<span class="lf-count lf-lost">${LENS}${tile.lost}</span>` : "") +
        "</span>"
      : `<span class="lf-dot${on}"></span>`;
    const marker = L.marker([tile.latitude, tile.longitude], {
      icon: L.divIcon({ className: "lf-marker", html, iconSize: [0, 0] }),
      title: describe(tile),
      alt: describe(tile),
      keyboard: true,
      zIndexOffset: busy ? 1000 : 0,
      riseOnHover: true,
    });
    marker.on("click", () => emit("select", tile.place));
    marker.on("keypress", (event: L.LeafletKeyboardEvent) => {
      if (event.originalEvent.key === "Enter" || event.originalEvent.key === " ") emit("select", tile.place);
    });
    markers.addLayer(marker);
  }
  if (!fitted && props.tiles.length) {
    map.fitBounds(L.latLngBounds(props.tiles.map((tile) => [tile.latitude, tile.longitude] as [number, number])), { padding: [40, 40] });
    fitted = true;
  }
}

onMounted(() => {
  if (!element.value) return;
  map = L.map(element.value, { scrollWheelZoom: false, zoomSnap: 0.5 }).setView([42.3601, -71.0915], 16);
  // Esri's Light Gray Canvas needs no API key (CARTO's light style now does). It has detail up to zoom 16;
  // closer than that, Leaflet enlarges the zoom-16 tiles.
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxNativeZoom: 16,
    maxZoom: 19,
  }).addTo(map);
  markers = L.layerGroup().addTo(map);
  map.on("zoomend", draw);
  draw();
});
watch(() => [props.tiles, props.selected], draw, { deep: true });
onUnmounted(() => map?.remove());
</script>

<template>
  <div ref="element" class="campus-map" role="region" aria-label="Campus map. Each marker is a building; choose one to see its reports." />
</template>

<style scoped>
.campus-map {
  width: 100%;
  height: min(520px, 62vh);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-line);
  /* Keeps Leaflet's panes below the page's dialogs and the add button. */
  isolation: isolate;
  z-index: 0;
}
</style>

<style>
/* Leaflet builds the markers outside Vue, so these styles are global; every class starts with lf-. */
.lf-marker {
  background: none;
  border: 0;
}
.lf-pill {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.lf-pill.on {
  border-color: var(--color-text);
  outline: 2px solid var(--color-text);
}
.lf-name {
  padding: 0 2px 0 6px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lf-count {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  color: #ffffff;
}
.lf-found {
  background: var(--color-found);
}
.lf-lost {
  background: var(--color-lost);
}
.lf-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: #8a8c93;
  box-shadow: 0 1px 3px rgba(25, 26, 30, 0.3);
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.lf-dot.on {
  outline: 3px solid var(--color-text);
}
.leaflet-marker-icon:focus-visible .lf-pill,
.leaflet-marker-icon:focus-visible .lf-dot {
  outline: 3px solid var(--color-text);
  outline-offset: 2px;
}
</style>
