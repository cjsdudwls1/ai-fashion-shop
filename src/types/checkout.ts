import { ShippingInfo } from './order';

export interface CheckoutFormData {
    shippingInfo: ShippingInfo;
    depositorName: string;
}
