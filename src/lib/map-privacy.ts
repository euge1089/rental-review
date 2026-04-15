const BLOCK_GRID_DEGREES = 0.0012;

function roundToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapToBlockLevel(point: { latitude: number; longitude: number }) {
  return {
    latitude: Number(roundToGrid(point.latitude, BLOCK_GRID_DEGREES).toFixed(6)),
    longitude: Number(roundToGrid(point.longitude, BLOCK_GRID_DEGREES).toFixed(6)),
  };
}
