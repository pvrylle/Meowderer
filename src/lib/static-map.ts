export function buildStaticMapUrl(lat: number, lng: number): string {
  const base = "https://tiles.stadiamaps.com/static/alidade_smooth.png";
  const params = new URLSearchParams({
    center: `${lng},${lat}`,
    zoom: "14",
    size: "512x120",
    scale: "2",
  });
  return `${base}?${params.toString()}`;
}
