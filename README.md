# AI 패션샵 - MVP

AI 아바타가 제품을 자동으로 소개하는 스마트 쇼핑몰 MVP입니다.

## 핵심 기능

### 관리자 (Admin)
- **단일 화면 상품 등록**: 이미지, 질감, 색상별 재고, 사이즈별 재고를 한 번에 입력
- **버튼 하나로 완료**: 등록 버튼만 누르면 모든 작업 자동 처리
- **드래그 앤 드롭**: 직관적인 이미지 업로드

### 시스템 자동화
- **쇼핑 카드 자동 생성**: 상품 등록 즉시 카드 형태로 표시
- **AI 영상 자동 생성**: 백그라운드에서 AI 아바타 소개 영상 생성
- **즉시 반영**: 제품 페이지에 실시간 업데이트

### 소비자 (Consumer)
- **제품 갤러리**: 쇼핑 카드 그리드로 상품 확인
- **영상 재생**: 카드 클릭 시 AI 소개 영상 재생
- **자동 갱신**: 5초마다 최신 상품 자동 로드

## 기술 스택

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Next.js API Routes
- **스타일링**: Tailwind CSS + Custom CSS
- **언어**: TypeScript
- **저장소**: 메모리 기반 (MVP용)

## 프로젝트 구조

```
src/
├── app/
│   ├── admin/          # 관리자 상품 등록 페이지
│   │   └── page.tsx
│   ├── products/       # 소비자 제품 갤러리 페이지
│   │   └── page.tsx
│   ├── api/
│   │   └── products/   # 상품 API
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── globals.css     # 글로벌 스타일
│   ├── layout.tsx      # 레이아웃
│   └── page.tsx        # 랜딩 페이지
└── lib/
    ├── types.ts        # 타입 정의
    ├── productStore.ts # 메모리 저장소
    └── aiVideoService.ts # AI 영상 서비스
```

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 페이지 안내

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 (서비스 소개) |
| `/admin` | 관리자 상품 등록 |
| `/products` | 소비자 제품 갤러리 |

## AI 영상 API 연동

현재 AI 영상 생성은 **모킹** 상태입니다. 실제 API 연동 시:

1. `src/lib/aiVideoService.ts` 파일 열기
2. 상단의 API 설정 변경:
   ```typescript
   const AI_VIDEO_API_KEY = '실제_API_키';
   const AI_VIDEO_API_ENDPOINT = '실제_API_엔드포인트';
   ```
3. `callAIVideoAPI` 함수 내 주석 해제 후 실제 로직 구현

## 확장 포인트

### 데이터베이스 연동
`src/lib/productStore.ts`를 실제 DB 클라이언트로 교체하면 됩니다.
인터페이스가 동일하게 유지되어 있어 코드 변경 최소화 가능.

### AI 서비스 교체
`src/lib/aiVideoService.ts`가 완전히 분리되어 있어 
다른 AI 서비스로 쉽게 교체 가능.

## 디자인 특징

- **다크 테마**: 프리미엄 느낌의 다크 모드
- **글래스모피즘**: 반투명 카드 효과
- **마이크로 애니메이션**: 부드러운 호버/트랜지션
- **그라데이션**: 포인트 컬러 그라데이션
- **반응형**: 모바일/태블릿/데스크탑 지원

## 라이선스

MVP Demo - Private Use
