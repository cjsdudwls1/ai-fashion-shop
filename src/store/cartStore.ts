import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // product id
    title: string;
    price: number;
    image_url?: string;
    quantity: number;
    category?: string;
    selectedColor?: string;
    selectedSize?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string, selectedColor?: string, selectedSize?: string) => void;
    updateQuantity: (id: string, selectedColor: string | undefined, selectedSize: string | undefined, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (newItem) => {
                set((state) => {
                    const quantityToAdd = newItem.quantity || 1;
                    const existingItemIndex = state.items.findIndex((item) =>
                        item.id === newItem.id &&
                        item.selectedColor === newItem.selectedColor &&
                        item.selectedSize === newItem.selectedSize
                    );

                    if (existingItemIndex !== -1) {
                        const newItems = [...state.items];
                        newItems[existingItemIndex].quantity += quantityToAdd;
                        return { items: newItems };
                    }
                    return { items: [...state.items, { ...newItem, quantity: quantityToAdd }] };
                });
            },
            removeItem: (id, selectedColor, selectedSize) => {
                set((state) => ({
                    items: state.items.filter((item) =>
                        !(item.id === id && item.selectedColor === selectedColor && item.selectedSize === selectedSize)
                    ),
                }));
            },
            updateQuantity: (id, selectedColor, selectedSize, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        (item.id === id && item.selectedColor === selectedColor && item.selectedSize === selectedSize)
                            ? { ...item, quantity: Math.max(1, quantity) }
                            : item
                    ),
                }));
            },
            clearCart: () => {
                set({ items: [] });
            },
            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },
            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },
        }),
        {
            name: 'shopping-cart-storage', // local storage key
        }
    )
);
