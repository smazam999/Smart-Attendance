// vault.js — client-side encryption vault
// The passphrase is NOT stored anywhere; only a one-way hash is stored in Supabase,
// and the derived AES key lives in IndexedDB (non-extractable).

const DB_NAME = 'sa_vault_v1';
const STORE = 'keys';
const SALT = 'smart-attendance-v1';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredKey() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get('enc_key');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function putStoredKey(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(key, 'enc_key');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deriveKey(passphrase) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 200000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,               // non-extractable — cannot be exported by XSS
    ['encrypt', 'decrypt']
  );
}

async function hashPassphrase(passphrase) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(SALT + ':' + passphrase));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Returns the CryptoKey, creating it from a passphrase if needed.
// Pass isNew=true only on the very first setup across all devices.
export async function ensureVault(supabase, passphrase, isNew) {
  const verifier = await hashPassphrase(passphrase);

  if (isNew) {
    const { error } = await supabase
      .from('app_settings')
      .insert({ key: 'vault_verifier', value: verifier });
    if (error) throw new Error('Could not save vault verifier: ' + error.message);
  } else {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'vault_verifier')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No vault exists yet — run first-time setup');
    if (data.value !== verifier) throw new Error('Incorrect vault passphrase');
  }

  const key = await deriveKey(passphrase);
  await putStoredKey(key);
  return key;
}

export async function encrypt(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ct)))
  };
}

export async function decrypt(enc, key) {
  if (!enc || !enc.iv || !enc.data) return null;
  try {
    const iv = Uint8Array.from(atob(enc.iv), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(enc.data), c => c.charCodeAt(0));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}