'use client';

/**
 * global-error.tsx — Next.js App Router 전역 에러 바운더리
 *
 * 목적:
 * - 클라이언트 사이드에서 처리되지 않은 예외 발생 시
 *   "Application error: a client-side exception has occurred" 대신
 *   실제 에러 내용을 표시하여 디버깅을 가능하게 한다.
 * - 구 버전 브라우저에서 어떤 API/문법이 문제인지 파악할 수 있도록
 *   에러 메시지를 화면에 노출한다.
 *
 * 참고: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ko">
            <body
                style={{
                    margin: 0,
                    padding: 0,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <div
                    style={{
                        maxWidth: '480px',
                        width: '100%',
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}
                >
                    {/* 아이콘 */}
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                        }}
                    >
                        !
                    </div>

                    <h1
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            marginBottom: '12px',
                            color: '#f1f5f9',
                        }}
                    >
                        문제가 발생했습니다
                    </h1>

                    <p
                        style={{
                            fontSize: '0.95rem',
                            color: '#94a3b8',
                            lineHeight: 1.6,
                            marginBottom: '24px',
                        }}
                    >
                        페이지를 불러오는 중 오류가 발생했습니다.
                        <br />
                        브라우저를 최신 버전으로 업데이트하면 해결될 수 있습니다.
                    </p>

                    {/* 에러 상세 (디버깅용) */}
                    <details
                        style={{
                            textAlign: 'left',
                            marginBottom: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <summary
                            style={{
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: '#64748b',
                                marginBottom: '8px',
                            }}
                        >
                            오류 상세 정보
                        </summary>
                        <pre
                            style={{
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                margin: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            {error.message || '알 수 없는 오류'}
                            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
                        </pre>
                    </details>

                    {/* 액션 버튼 */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={reset}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={function () {
                                if (typeof window !== 'undefined') {
                                    window.location.href = '/';
                                }
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'transparent',
                                color: '#94a3b8',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            홈으로
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
