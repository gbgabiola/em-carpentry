export function getComparisonPair<T extends { id: string; role: string }>(
  images: T[],
) {
  const before = images.filter((image) => image.role === "before");
  const after = images.filter((image) => image.role === "after");
  if (before.length !== 1 || after.length !== 1 || before[0].id === after[0].id)
    return null;
  return { before: before[0], after: after[0] };
}
