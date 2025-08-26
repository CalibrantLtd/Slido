export default function generateRandomKey(index: number): string {
  return `key-${index}-${Math.random().toString(36).substr(2, 9)}`;
}

