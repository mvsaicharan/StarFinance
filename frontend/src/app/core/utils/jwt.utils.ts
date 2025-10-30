// src/app/core/utils/jwt.utils.ts
export function decodeJwtPayload(token: string): any | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const base64UrlPayload = token.split('.')[1];
    if (!base64UrlPayload) return null;
    // Convert Base64URL to Base64
    let base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64Payload.length % 4) base64Payload += '=';
    // Decode and parse
    const jsonPayload = atob(base64Payload);
    const payload = JSON.parse(jsonPayload);
    console.log('Decoded JWT Payload:', payload); // Log full payload for inspection
    return payload;
  } catch (error) {
    console.warn('JWT decode failed:', error);
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    console.log('isJwtExpired: No exp claim or invalid; treating as non-expired');
    return false; // RELAXED: Treat as valid if no exp (common for custom/short tokens)
  }
  const expired = Date.now() >= payload.exp * 1000;
  console.log(`isJwtExpired: exp=${payload.exp * 1000}, now=${Date.now()}, expired=${expired}`);
  return expired;
}

export function getJwtRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  let role = payload.role || (payload.authorities && payload.authorities[0]) || null;
  // Handle nested Spring authorities (e.g., {authority: 'ROLE_CUSTOMER'})
  if (role && typeof role === 'object' && role.authority) {
    role = role.authority;
  }
  console.log('Extracted JWT Role:', role); // Log for inspection
  return role;
}