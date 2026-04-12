#!/bin/bash
# =============================================================
# Claude Code on the web - VM 환경 자동 세팅 스크립트
# 매 새로운 세션마다 실행하여 개발 환경을 빠르게 구성합니다.
# 사용법: bash setup.sh
# =============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} AI Fashion Shop - 환경 세팅 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ---------------------------------------------------------
# 1단계: Node.js 버전 확인
# ---------------------------------------------------------
echo -e "${YELLOW}[1/5] Node.js 버전 확인...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}  Node.js ${NODE_VERSION} 감지됨${NC}"

    # 최소 버전 18.17.0 확인
    REQUIRED_MAJOR=18
    CURRENT_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d'.' -f1)
    if [ "$CURRENT_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
        echo -e "${RED}  ERROR: Node.js >= 18.17.0 필요. 현재: ${NODE_VERSION}${NC}"
        echo -e "${YELLOW}  nvm install 18 또는 nvm install 20 실행 후 재시도하세요.${NC}"
        exit 1
    fi
else
    echo -e "${RED}  ERROR: Node.js가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}  Claude Code on the web VM에는 기본 설치되어 있어야 합니다.${NC}"
    exit 1
fi

# ---------------------------------------------------------
# 2단계: npm 의존성 설치
# ---------------------------------------------------------
echo ""
echo -e "${YELLOW}[2/5] npm 의존성 설치...${NC}"
if [ -f "package.json" ]; then
    if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
        echo -e "${GREEN}  node_modules 이미 존재 - npm ci로 빠른 설치${NC}"
        npm ci --prefer-offline 2>/dev/null || npm install
    else
        echo -e "${BLUE}  npm install 실행 중... (첫 설치, 1-2분 소요)${NC}"
        npm install
    fi
    echo -e "${GREEN}  의존성 설치 완료${NC}"
else
    echo -e "${RED}  ERROR: package.json을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}  ai-fashion-shop/ 디렉토리에서 실행하세요.${NC}"
    exit 1
fi

# ---------------------------------------------------------
# 3단계: 환경변수 파일 확인
# ---------------------------------------------------------
echo ""
echo -e "${YELLOW}[3/5] 환경변수 확인...${NC}"

ENV_FILE=".env.local"
ENV_EXAMPLE=".env.example"
MISSING_VARS=()

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}  .env.local 파일 존재${NC}"

    # 필수 환경변수 체크
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "GOOGLE_CLOUD_PROJECT"
        "GOOGLE_CLIENT_EMAIL"
        "GOOGLE_PRIVATE_KEY"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
        "NEXT_PUBLIC_PORTONE_STORE_ID"
        "PORTONE_API_SECRET"
    )

    for VAR in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${VAR}=" "$ENV_FILE" 2>/dev/null; then
            MISSING_VARS+=("$VAR")
        fi
    done

    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}  필수 환경변수 모두 설정됨${NC}"
    else
        echo -e "${YELLOW}  경고: 다음 필수 환경변수가 누락되었습니다:${NC}"
        for VAR in "${MISSING_VARS[@]}"; do
            echo -e "${RED}    - ${VAR}${NC}"
        done
        echo -e "${YELLOW}  .env.example을 참고하여 추가하세요.${NC}"
    fi
else
    echo -e "${RED}  WARNING: .env.local 파일이 없습니다!${NC}"
    echo ""
    echo -e "${YELLOW}  해결 방법:${NC}"
    echo -e "${YELLOW}  1. GitHub Secrets에서 자동 주입되었는지 확인${NC}"
    echo -e "${YELLOW}  2. 수동 생성: cp ${ENV_EXAMPLE} ${ENV_FILE} 후 값 입력${NC}"
    echo -e "${YELLOW}  3. 사용자에게 환경변수 값을 요청${NC}"
    echo ""

    # .env.example이 있으면 복사 제안
    if [ -f "$ENV_EXAMPLE" ]; then
        echo -e "${BLUE}  .env.example을 기반으로 .env.local을 생성할까요?${NC}"
        echo -e "${BLUE}  실행: cp ${ENV_EXAMPLE} ${ENV_FILE}${NC}"
    fi
fi

# ---------------------------------------------------------
# 4단계: Playwright 브라우저 (E2E 테스트 필요 시)
# ---------------------------------------------------------
echo ""
echo -e "${YELLOW}[4/5] 선택적 도구 확인...${NC}"

if grep -q "@playwright/test" package.json 2>/dev/null; then
    echo -e "${BLUE}  Playwright 감지됨 (E2E 테스트 필요 시: npx playwright install chromium)${NC}"
fi

# ---------------------------------------------------------
# 5단계: 빌드 테스트 (선택)
# ---------------------------------------------------------
echo ""
echo -e "${YELLOW}[5/5] TypeScript 타입 체크...${NC}"
if [ -f "$ENV_FILE" ]; then
    npx tsc --noEmit --pretty 2>/dev/null && \
        echo -e "${GREEN}  타입 체크 통과${NC}" || \
        echo -e "${YELLOW}  타입 체크 경고 있음 (빌드에는 영향 없을 수 있음)${NC}"
else
    echo -e "${YELLOW}  .env.local 없이는 타입 체크 스킵${NC}"
fi

# ---------------------------------------------------------
# 완료
# ---------------------------------------------------------
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN} 환경 세팅 완료!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  개발 서버 시작: ${BLUE}npm run dev${NC}"
echo -e "  빌드:          ${BLUE}npm run build${NC}"
echo -e "  린트:          ${BLUE}npm run lint${NC}"
echo ""
