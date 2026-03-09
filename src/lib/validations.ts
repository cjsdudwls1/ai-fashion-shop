import { z } from 'zod';

// [2026-03-06] 그룹 H: 주석 한글 통일 + imageUrl 스키마 정리
// 사유: 영어 주석을 프로젝트 컨벤션(한글)으로 통일
// imageUrl: .min(1)과 .optional() 혼용 시 의미 충돌 → .optional()만 유지
// 근거: .docs/refactoring-group-h-type-safety.md L-19
export const productSchema = z.object({
    name: z.string()
        .min(2, "상품명은 2글자 이상이어야 합니다.")
        .max(100, "상품명은 100글자 이하여야 합니다."),
    price: z.number()
        .min(0, "가격은 0원 이상이어야 합니다.")
        .default(0),
    // 이미지 URL은 선택 사항. 등록 시점에는 없을 수 있으며 업로드 후 설정됨.
    imageUrl: z.string().optional(),
    imageBase64: z.string().optional(),
    galleryImages: z.array(z.object({
        url: z.string().optional(),
        base64: z.string().optional(),
        color: z.string().optional(),
        isPrimary: z.boolean().optional(),
    })).optional(),
    fabric: z.string().min(1, "소재 정보를 입력해주세요."),
    gender: z.enum(['female', 'male', 'unisex']),
    category: z.string().optional(),
    narrationText: z.string().optional(),
    // 색상/사이즈 텍스트: API에서 문자열로 수신하며, 파싱된 배열은 폼 컴포넌트에서 검증
    colorsText: z.string().optional(),
    sizesText: z.string().optional(),
    mediaGenerationType: z.enum(['video', 'image', 'none']).optional(),
    videoModel: z.string().optional(),
});
