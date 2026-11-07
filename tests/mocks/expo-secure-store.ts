const secureStoreMock = new Map<string, string>();

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function getItemAsync(key: string): Promise<string | null> {
  return secureStoreMock.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  secureStoreMock.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  secureStoreMock.delete(key);
}
