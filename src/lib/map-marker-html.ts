import type { Poi } from "@/lib/overpass";
import type { FeaturedPlace } from "@/lib/featured-places";
import type { FeaturedVet } from "@/lib/featured-vets";

const PRIMARY = "#8b6cc7";
const VET_CURATED = "#5b7fc7";
const GOLD = "#f0c14d";
const SHELTER_GREEN = "#6bc49a";
const VET_BLUE = "#6ba3e0";

/** Minimum touch target — padding wraps the visible pin SVG. */
const TAP_PADDING_PX = 10;

function bindMarkerTap(btn: HTMLButtonElement, onClick: () => void): void {
  let downX = 0;
  let downY = 0;
  let downAt = 0;

  btn.addEventListener("pointerdown", (e) => {
    downX = e.clientX;
    downY = e.clientY;
    downAt = Date.now();
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  btn.addEventListener("pointerup", (e) => {
    e.stopPropagation();
    if (btn.hasPointerCapture(e.pointerId)) {
      btn.releasePointerCapture(e.pointerId);
    }

    const dx = Math.abs(e.clientX - downX);
    const dy = Math.abs(e.clientY - downY);
    const dt = Date.now() - downAt;

    if (dx <= 12 && dy <= 12 && dt < 450) {
      onClick();
    }
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function markerButton(onClick: () => void, ariaLabel: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", ariaLabel);
  btn.className =
    "catch-map-pin-btn block cursor-pointer border-0 bg-transparent transition-transform active:scale-95";
  btn.style.touchAction = "manipulation";
  btn.style.padding = `${TAP_PADDING_PX}px`;
  btn.style.margin = `-${TAP_PADDING_PX}px`;
  bindMarkerTap(btn, onClick);
  return btn;
}

function pinHeightForZoom(zoom: number): number {
  if (zoom < 8) return 32;
  if (zoom < 11) return 36;
  if (zoom < 14) return 40;
  return 44;
}

function teardropSvg(opts: {
  width: number;
  height: number;
  fill: string;
  badgeFill: string;
  icon: "home" | "vet";
}): string {
  const { width, height, fill, badgeFill, icon } = opts;
  const homeIcon =
    '<path d="M16 10.2L12.2 13.4V17.8H19.8V13.4L16 10.2Z" fill="white"/><rect x="14" y="16.2" width="4" height="2.2" rx="0.6" fill="white" opacity="0.95"/>';
  const vetIcon =
    '<rect x="14.2" y="10" width="3.6" height="9.2" rx="0.8" fill="white"/><rect x="11.4" y="12.6" width="9.2" height="3.6" rx="0.8" fill="white"/>';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg"
      style="display:block;filter:drop-shadow(0 2px 5px rgba(58,53,80,0.2));pointer-events:none">
      <path d="M16 1.5C23.18 1.5 29 7.32 29 14.5C29 21.2 16 37 16 37C16 37 3 21.2 3 14.5C3 7.32 8.82 1.5 16 1.5Z"
        fill="${fill}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="14.5" r="7.25" fill="${badgeFill}" stroke="white" stroke-width="1.5"/>
      ${icon === "home" ? homeIcon : vetIcon}
    </svg>`;
}

export function buildFeaturedPinButton(
  place: FeaturedPlace,
  zoom: number,
  onClick: () => void,
): HTMLButtonElement {
  const btn = markerButton(onClick, `${place.name}, curated shelter`);
  const height = pinHeightForZoom(zoom);
  const width = Math.round(height * 0.8);
  btn.innerHTML = teardropSvg({
    width,
    height,
    fill: PRIMARY,
    badgeFill: GOLD,
    icon: "home",
  });
  return btn;
}

export function buildFeaturedVetPinButton(
  place: FeaturedVet,
  zoom: number,
  onClick: () => void,
): HTMLButtonElement {
  const btn = markerButton(onClick, `${place.name}, curated vet`);
  const height = pinHeightForZoom(zoom);
  const width = Math.round(height * 0.8);
  btn.innerHTML = teardropSvg({
    width,
    height,
    fill: VET_CURATED,
    badgeFill: GOLD,
    icon: "vet",
  });
  return btn;
}

export function buildPoiPinButton(
  poi: Poi,
  zoom: number,
  onClick: () => void,
): HTMLButtonElement {
  const btn = markerButton(
    onClick,
    `${poi.name}, ${poi.type === "shelter" ? "shelter" : "vet"}`,
  );
  const height = Math.max(24, pinHeightForZoom(zoom) - 4);
  const width = Math.round(height * 0.8);
  const fill = poi.type === "shelter" ? SHELTER_GREEN : VET_BLUE;
  btn.innerHTML = teardropSvg({
    width,
    height,
    fill,
    badgeFill: "rgba(255,255,255,0.35)",
    icon: poi.type === "shelter" ? "home" : "vet",
  });
  return btn;
}

export { bindMarkerTap };
