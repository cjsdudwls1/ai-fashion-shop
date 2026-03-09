"use client";

import Image from 'next/image';
import { ImageIcon, Trash2, Minus, Plus } from 'lucide-react';
import { CartItem } from '@/store/cartStore';

interface CartItemCardProps {
    item: CartItem;
    onRemove: (id: string, color?: string, size?: string) => void;
    onQuantityChange: (id: string, color: string | undefined, size: string | undefined, qty: number) => void;
}

export function CartItemCard({ item, onRemove, onQuantityChange }: CartItemCardProps) {
    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 0.2s ease',
            }}
            className="group hover:shadow-md"
        >
            {/* Product Image */}
            <div style={{
                width: '100px', flexShrink: 0, position: 'relative',
                aspectRatio: '3/4', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', backgroundColor: 'var(--bg-elevated)',
            }}>
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                    }}>
                        <ImageIcon size={24} />
                    </div>
                )}
            </div>

            {/* Product Info & Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{
                            fontSize: '16px', fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.4,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                            {item.title}
                        </h3>
                        <button
                            onClick={() => onRemove(item.id, item.selectedColor, item.selectedSize)}
                            className="hover-delete-btn"
                            style={{
                                padding: '8px', marginLeft: '12px',
                                color: 'var(--text-muted)',
                                borderRadius: '50%', border: 'none', background: 'none',
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                            aria-label="삭제"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.selectedColor && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                fontSize: '12px', color: 'var(--text-secondary)',
                                background: 'var(--bg-elevated)',
                                padding: '3px 10px', borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                            }}>
                                {item.selectedSize ? 'Color:' : 'Option:'} <span style={{ fontWeight: 600, marginLeft: '4px', color: 'var(--text-primary)' }}>{item.selectedColor}</span>
                            </span>
                        )}
                        {item.selectedSize && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                fontSize: '12px', color: 'var(--text-secondary)',
                                background: 'var(--bg-elevated)',
                                padding: '3px 10px', borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                            }}>
                                Size: <span style={{ fontWeight: 600, marginLeft: '4px', color: 'var(--text-primary)' }}>{item.selectedSize}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '12px' }}>
                    {/* 수량 조절 */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                        padding: '2px', border: '1px solid var(--border-color)',
                    }}>
                        <button
                            onClick={() => onQuantityChange(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            style={{
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px', border: 'none', background: 'none',
                                cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                color: 'var(--text-secondary)',
                                opacity: item.quantity <= 1 ? 0.4 : 1,
                                transition: 'background 0.15s',
                            }}
                        >
                            <Minus size={14} />
                        </button>
                        <span style={{
                            width: '28px', textAlign: 'center',
                            fontWeight: 700, fontSize: '14px',
                            color: 'var(--text-primary)',
                        }}>
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => onQuantityChange(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                            style={{
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px', border: 'none', background: 'none',
                                cursor: 'pointer', color: 'var(--text-secondary)',
                                transition: 'background 0.15s',
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* 가격 */}
                    <div style={{ textAlign: 'right' }}>
                        {item.quantity > 1 && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                {item.price.toLocaleString()}원 x {item.quantity}
                            </p>
                        )}
                        <p style={{
                            fontSize: '18px', fontWeight: 700,
                            color: 'var(--text-primary)', letterSpacing: '-0.02em',
                        }}>
                            {(item.price * item.quantity).toLocaleString()}원
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
