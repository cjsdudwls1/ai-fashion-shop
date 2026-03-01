import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * 숫자를 한국 원화 형식으로 포맷합니다.
 * @example formatPrice(25000) → '25,000원'
 */
export function formatPrice(price: number): string {
    return price.toLocaleString('ko-KR') + '원';
}
