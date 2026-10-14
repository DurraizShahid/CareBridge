import type { TourArea, TourStop } from "@/lib/facility-tour";

// Floor plan in metres, top-down (x → east, z → south). Shared by the 3D scene
// and the SVG minimap, so it must stay free of three.js imports.
export type Vec3 = [number, number, number];

export const AREAS: Record<TourArea, { name: string; x: [number, number]; z: [number, number] }> = {
  lobby: { name: "Lobby", x: [-6, 6], z: [1, 11] },
  corridor: { name: "Corridor", x: [-1.5, 1.5], z: [-13, 1] },
  room: { name: "Room", x: [1.5, 8], z: [-13, -5] },
};

const VIEWS: Record<TourArea, { position: Vec3; target: Vec3 }> = {
  lobby: { position: [7.5, 7, 16.5], target: [0, 0.6, 6] },
  corridor: { position: [-2.5, 6.5, 5], target: [0, 0.6, -6] },
  room: { position: [-0.5, 7.5, -1.5], target: [4.8, 0.5, -9] },
};

export const OVERVIEW = { position: [16, 19, 15] as Vec3, target: [1, 0, -1] as Vec3 };

// Hotspot anchors per area; stops sharing an area take successive anchors.
const ANCHORS: Record<TourArea, Vec3[]> = {
  lobby: [[-3.2, 1.7, 3.6], [3.4, 1.4, 7], [0, 1.4, 9.6]],
  corridor: [[0, 1.6, -2], [0, 1.6, -6.5], [0, 1.6, -11]],
  room: [[4.4, 1.5, -9.4], [6.8, 1.5, -6.6], [7.2, 1.9, -11.8]],
};

export interface PlacedStop extends TourStop {
  anchor: Vec3;
  view: { position: Vec3; target: Vec3 };
}

export function placeStops(stops: TourStop[]): PlacedStop[] {
  const used: Record<TourArea, number> = { lobby: 0, corridor: 0, room: 0 };
  return stops.map((stop) => {
    const n = used[stop.area]++;
    const anchors = ANCHORS[stop.area];
    const anchor = anchors[n % anchors.length];
    const base = VIEWS[stop.area];
    // Look at the hotspot itself; nudge the camera sideways for repeat visits to an area.
    const target: Vec3 = [(base.target[0] + anchor[0]) / 2, 0.6, (base.target[2] + anchor[2]) / 2];
    const position = base.position.map((p, i) => p - base.target[i] + target[i]) as Vec3;
    position[0] += n * 1.5;
    return { ...stop, anchor, view: { position, target } };
  });
}
