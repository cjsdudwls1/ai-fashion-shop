import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// [2026-03-06] 그룹 G: Math.random() → crypto.randomUUID() 전환
// 사유: Math.random()은 암호학적으로 안전하지 않음
// 근거: .docs/refactoring-group-g-security.md L-15
export function generateId(): string {
    return `prod_${crypto.randomUUID()}`;
}
