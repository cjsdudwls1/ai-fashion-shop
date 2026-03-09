export interface StockCheckItem {
    id: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
}

export interface StockCheckResult {
    id: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    valid: boolean;
    currentStock?: number;
    message?: string;
}

export interface DeductStockItem {
    product_id: string;
    color?: string;
    size?: string;
    quantity: number;
}
