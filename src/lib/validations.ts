import { z } from 'zod';

export const productSchema = z.object({
    name: z.string()
        .min(2, "상품명은 2글자 이상이어야 합니다.")
        .max(100, "상품명은 100글자 이하여야 합니다."),
    price: z.number()
        .min(0, "가격은 0원 이상이어야 합니다.")
        .default(0),
    imageUrl: z.string().min(1, "상품 이미지를 업로드해주세요.").optional(),
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
    // Validate that we have at least valid color or size text representation or validate the parsed object later.
    // Since input is text (or processed object), we'll validate the processed stock list in the form component, 
    // but the API receives text or JSON. The current API expects `colorsText` and `sizesText`.
    // Let's validate simple string existence here, or better, validate the arrays if we change API to accept arrays.
    // For now, sticking to current API structure:
    colorsText: z.string().optional(),
    sizesText: z.string().optional(),
    mediaGenerationType: z.enum(['video', 'image', 'none']).optional(),
    videoModel: z.string().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;
