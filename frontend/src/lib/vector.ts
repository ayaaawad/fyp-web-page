export function generateSimulationVector(dimension = 128): number[] {
  return Array.from({ length: dimension }, () => Number(Math.random().toFixed(6)));
}

export function compactVector(vector: number[], visible = 8): string {
  if (vector.length === 0) {
    return '[]';
  }

  const head = vector.slice(0, visible).join(', ');
  return `[${head}${vector.length > visible ? ', ...' : ''}]`;
}
