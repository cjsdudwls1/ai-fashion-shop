export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '';
export const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '';

/**
 * PG 카드결제가 가능한지 확인 (storeId + channelKey 모두 설정되어야 함)
 */
export function isCardPaymentAvailable(): boolean {
  return !!(PORTONE_STORE_ID && PORTONE_CHANNEL_KEY);
}

if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
  console.warn(
    '[PortOne] storeId 또는 channelKey가 미설정 상태입니다. ' +
    '카드/간편결제를 사용하려면 포트원 관리자 콘솔에서 테스트 채널을 생성하고 ' +
    'NEXT_PUBLIC_PORTONE_CHANNEL_KEY 환경변수를 설정해주세요.'
  );
}
