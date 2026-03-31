export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '';
export const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '';

if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
  console.warn('PortOne configuration is missing. Payment functionality may not work.');
}
