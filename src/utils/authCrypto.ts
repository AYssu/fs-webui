const SECRET = 'FastScanV3-UserAuth-Encrypt-Key';
const SALT = 'FastScanV3-Auth-Salt';

const te = new TextEncoder();
const td = new TextDecoder();

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getKey = async (): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey('raw', te.encode(SECRET), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: te.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptText = async (plainText: string): Promise<string> => {
  if (!plainText) return '';
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(plainText));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
};

export const decryptText = async (cipherText: string): Promise<string> => {
  if (!cipherText) return '';
  const [ivB64, dataB64] = cipherText.split('.');
  if (!ivB64 || !dataB64) return '';
  try {
    const key = await getKey();
    const iv = fromBase64(ivB64);
    const data = fromBase64(dataB64);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as BufferSource
    );
    return td.decode(plain);
  } catch {
    return '';
  }
};
