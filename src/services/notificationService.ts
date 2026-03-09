// src/services/notificationService.ts

/**
 * 외부 알림(텔레그램 등) 전송을 담당하는 서비스
 */
export const notificationService = {
    /**
     * 텔레그램 메시지를 전송합니다. 비동기로 실행되어 메인 스레드를 블로킹하지 않습니다.
     */
    sendOrderNotification(orderCode: string, depositorName: string, totalAmount: number, itemNames: string) {
        // 비동기 실행을 위해 Promise를 반환하지 않고 내부에서 catch로 에러 처리만 수행
        import('@/lib/telegramUtils').then(({ sendTelegramNotification }) => {
            const message = `
🔔 <b>신규 주문 알림</b>
- 주문번호: ${orderCode}
- 주문자: ${depositorName}
- 결제금액: ${totalAmount.toLocaleString()}원
- 상품: ${itemNames}
            `.trim();

            sendTelegramNotification(message).catch(err => {
                console.error('Telegram Notify Error in notificationService:', err);
            });
        }).catch(err => {
            console.error('Failed to import telegramUtils:', err);
        });
    }
};
