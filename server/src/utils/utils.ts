export const mapToObject = <K extends string | number, V>(map: Map<K, V>): Record<K, V> => {
  const object: Record<K, V> = {} as Record<K, V>;
  map.forEach((value, key) => {
    object[key] = value;
  });
  return object;
};
