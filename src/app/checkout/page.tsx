import CheckoutClient from '@/components/checkout/CheckoutClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '주문/결제 | AI Fashion Shop',
    description: '상품 주문 및 결제 페이지입니다.',
};

export default function CheckoutPage() {
    return <CheckoutClient />;
}
