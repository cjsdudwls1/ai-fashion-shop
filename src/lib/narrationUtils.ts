import { Gender } from './types';

export function getNarrationOptions(
    productInfo: { name: string; fabric: string; gender: Gender; category?: string }
): string[] {
    const genderText = productInfo.gender === 'female' ? '여성' : '남성';
    const categoryText = productInfo.category === 'short-sleeve' ? '반팔 티셔츠' :
        productInfo.category === 'long-sleeve' ? '긴팔 티셔츠' :
            productInfo.category === 'sleeveless' ? '민소매' :
                productInfo.category === 'shirt' ? '셔츠' :
                    productInfo.category === 'knit' ? '니트' :
                        productInfo.category === 'hoodie' ? '후드' :
                            productInfo.category === 'pants' ? '팬츠' :
                                productInfo.category === 'shorts' ? '쇼츠' :
                                    productInfo.category === 'skirt' ? '스커트' :
                                        productInfo.category === 'denim' ? '데님' :
                                            productInfo.category === 'slacks' ? '슬랙스' :
                                                productInfo.category === 'jacket' ? '자켓' :
                                                    productInfo.category === 'coat' ? '코트' :
                                                        productInfo.category === 'padding' ? '패딩' :
                                                            productInfo.category === 'cardigan' ? '가디건' :
                                                                productInfo.category === 'onepiece' ? '원피스' :
                                                                    '아이템';

    // 짧고 세련된 5초 분량의 나레이션 (약 40~60자)
    return [
        `${productInfo.name}. ${productInfo.fabric} 소재의 프리미엄 ${genderText} ${categoryText}입니다.`,
        `${productInfo.fabric} 소재로 완성한 ${productInfo.name}. 세련된 ${genderText} ${categoryText} 룩을 만나보세요.`,
        `프리미엄 ${productInfo.fabric} 소재, ${productInfo.name}. ${genderText}을 위한 특별한 ${categoryText}.`,
    ];
}
