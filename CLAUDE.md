# AI Fashion Shop - 프로젝트 지침

## 프로젝트 개요
AI 기반 패션 쇼핑몰 웹 애플리케이션

## 기술 스택
- **프레임워크**: Next.js 16.1.6 (App Router)
- **언어**: TypeScript
- **런타임**: Node.js >= 18.17.0
- **패키지 매니저**: npm
- **UI**: React 19 + Tailwind CSS 4 + Zustand 5
- **DB**: Supabase (PostgreSQL)
- **AI**: Google Generative AI (Gemini, Imagen 3, Veo 2)
- **이미지 호스팅**: Cloudinary
- **결제**: PortOne (PG)
- **배포**: Netlify (SSR)
- **인증**: Supabase Auth + Naver OAuth

## Claude Code on the web - 새 VM 환경 자동 세팅

**매 세션 시작 시 반드시 아래 순서를 따를 것:**

### 1단계: 환경 구성 스크립트 실행
```bash
bash setup.sh
```

### 2단계: 환경변수 확인
- `.env.local`이 존재하는지 확인
- 누락 시 `.env.example`을 참고하여 사용자에게 안내

### 3단계: 개발 서버 시작 (필요 시)
```bash
npm run dev
```

## 프로젝트 구조

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API 엔드포인트 (서버 사이드)
│   │   │   ├── admin/          # 관리자 API
│   │   │   ├── orders/         # 주문 API
│   │   │   ├── portone-webhook/# PG 결제 웹훅
│   │   │   ├── products/       # 상품 API
│   │   │   └── sync/           # 비디오 동기화 API
│   │   ├── admin/              # 관리자 대시보드 페이지
│   │   ├── auth/               # 인증 콜백
│   │   ├── cart/               # 장바구니
│   │   ├── checkout/           # 결제
│   │   ├── login/              # 로그인
│   │   └── products/           # 상품 목록/상세
│   ├── components/             # React 컴포넌트
│   ├── lib/                    # 유틸리티 및 클라이언트
│   ├── services/               # 비즈니스 로직
│   ├── hooks/                  # React 커스텀 훅
│   ├── store/                  # Zustand 상태 관리
│   ├── types/                  # TypeScript 타입 정의
│   └── styles/                 # CSS
├── supabase/migrations/        # DB 마이그레이션 SQL
├── setup.sh                    # VM 환경 자동 세팅 스크립트
├── .env.example                # 환경변수 템플릿
└── CLAUDE.md                   # 이 파일
```

## 주요 외부 서비스 연동

| 서비스 | 용도 | 환경변수 접두사 |
|--------|------|----------------|
| Supabase | DB + Auth | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*` |
| Google Vertex AI | AI 이미지/비디오 생성 | `GOOGLE_*` |
| Cloudinary | 이미지 CDN/업로드 | `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_*` |
| PortOne | PG 결제 | `NEXT_PUBLIC_PORTONE_*`, `PORTONE_*` |
| Telegram | 주문 알림 | `TELEGRAM_*` |
| Naver | 소셜 로그인 | `NAVER_*` |
| Formspree | 문의 폼 | `NEXT_PUBLIC_FORMSPREE_ID` |

## 핵심 규칙

### 환경변수 (절대 코드에 하드코딩 금지)
- `NEXT_PUBLIC_*` 접두사: 클라이언트에서 접근 가능
- 나머지: 서버 사이드 전용 (API Route, Server Component에서만 사용)
- `.env.local`은 git에 커밋하지 않음

### 배포
- Netlify에 배포됨
- `netlify.toml`에 캐시 제어 설정 있음
- 빌드 명령: `npm run build`

### 빌드 & 개발
```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 언어
- 코드 주석: 한국어
- 커밋 메시지: 한국어
- 사용자와의 대화: 한국어
