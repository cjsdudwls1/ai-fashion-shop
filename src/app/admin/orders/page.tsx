'use client';

import { getStatusInfo } from '@/lib/orderUtils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useOrders, STATUS_FILTERS, NEXT_STATUS_MAP } from '@/hooks/useOrders';
import { RefreshCw, ChevronRight, ClipboardList } from 'lucide-react';
import './orders.css';

// 헬퍼: 정보 행
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

export default function AdminOrdersPage() {
    const {
        orders, loading, activeFilter, setActiveFilter,
        expandedOrderId, toggleExpand, updatingOrderId,
        confirmModal, statusLogs, fetchOrders,
        requestStatusChange, handleStatusChange, closeConfirmModal,
        getFilterCount, totalAmount, filterRef,
    } = useOrders();

    return (
        <div style={{ background: 'var(--bg-elevated)', minHeight: '100vh' }}>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                isDanger={confirmModal.isDanger}
                onConfirm={() => handleStatusChange(confirmModal.orderId, confirmModal.newStatus)}
                onCancel={closeConfirmModal}
            />

            <div className="admin-orders-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 24px 120px' }}>

                {/* 헤더 */}
                <div className="admin-orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 className="admin-orders-title" style={{ fontSize: '33px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>주문 관리</h1>
                    <div className="admin-orders-header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {orders.length > 0 && (
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '18px', color: 'var(--text-muted)', display: 'block' }}>총 {orders.length}건</span>
                                <span className="admin-orders-total-amount" style={{ fontSize: '27px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalAmount.toLocaleString()}원</span>
                            </div>
                        )}
                        <button onClick={fetchOrders} className="admin-refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', fontSize: '20px', fontWeight: 600, borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <RefreshCw size={14} /> 새로고침
                        </button>
                    </div>
                </div>

                {/* 필터 탭 */}
                <div ref={filterRef} style={{ position: 'sticky', top: '80px', zIndex: 30, background: 'var(--bg-elevated)', paddingBottom: '16px', paddingTop: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                        {STATUS_FILTERS.map(filter => {
                            const count = getFilterCount(filter.key);
                            const isActive = activeFilter === filter.key;
                            return (
                                <button key={filter.key} onClick={() => setActiveFilter(filter.key)} className="admin-filter-btn" style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', fontSize: '21px',
                                    fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
                                    border: isActive ? '2px solid #4F46E5' : '1px solid var(--border-color)',
                                    background: isActive ? '#4F46E5' : 'var(--bg-card)', color: isActive ? '#fff' : 'var(--text-secondary)',
                                    boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                                }}>
                                    {filter.label}
                                    <span className="admin-filter-count" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', height: '28px', padding: '0 6px', borderRadius: '6px', fontSize: '18px', fontWeight: 700, background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-muted)' }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 주문 목록 */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                        <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#4F46E5' }} />
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <ClipboardList size={48} stroke="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '21px' }}>해당 상태의 주문이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--border-color)' }}>
                        {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            const isUpdating = updatingOrderId === order.id;
                            const logs = statusLogs[order.id] || [];

                            return (
                                <div key={order.id} style={{ background: 'var(--bg-card)' }}>
                                    {/* 주문 행 */}
                                    <div onClick={() => toggleExpand(order.id)} className="admin-order-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', cursor: 'pointer', transition: 'background 0.15s', gap: '16px' }}>
                                        <div className="admin-order-row-left" style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                                                <ChevronRight size={18} stroke="var(--text-muted)" strokeWidth={2.5} />
                                            </div>
                                            <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{order.shipping_name}</span>
                                            {order.depositor_name && order.depositor_name !== order.shipping_name && (
                                                <span style={{ fontSize: '16px', color: '#F59E0B', fontWeight: 600, flexShrink: 0 }}>(입금자명: {order.depositor_name})</span>
                                            )}
                                            <span className={statusInfo.color} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '8px', fontSize: '18px', fontWeight: 600, flexShrink: 0 }}>{statusInfo.label}</span>
                                            <span className="admin-order-number" style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0, letterSpacing: '0.03em' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>주문번호</span> #{order.guest_order_code || order.id.slice(0, 8)}
                                            </span>
                                            <span style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0, display: 'none' }} className="sm-show">
                                                {new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="admin-order-row-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '16px', color: 'var(--text-muted)', display: 'block' }} className="sm-hide-inline">
                                                {new Date(order.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{order.total_amount?.toLocaleString()}원</span>
                                        </div>
                                    </div>

                                    {/* 확장 패널 */}
                                    {isExpanded && (
                                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px 20px', background: 'var(--bg-elevated)', animation: 'slideDown 0.2s ease-out' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="admin-detail-grid">
                                                {/* 좌측: 고객+배송+로그 */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {/* 고객 정보 */}
                                                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>고객 정보</h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>유형</span>
                                                                {order.user_id ? <span style={{ fontSize: '20px', color: '#3B82F6', fontWeight: 600 }}>회원</span> : <span style={{ fontSize: '20px', color: 'var(--text-muted)', fontWeight: 500, padding: '3px 10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>비회원</span>}
                                                            </div>
                                                            {order.depositor_name && <InfoRow label="입금자명" value={order.depositor_name} />}
                                                            <InfoRow label="주문번호" value={`#${order.guest_order_code || order.id.slice(0, 8)}`} />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>주문일시</span>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* 배송 정보 */}
                                                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>배송 정보</h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <InfoRow label="받는 분" value={order.shipping_name} />
                                                            <InfoRow label="연락처" value={order.shipping_phone} />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0 }}>주소</span>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '65%', lineHeight: 1.5 }}>{order.shipping_address}</span>
                                                            </div>
                                                            {order.shipping_memo && <InfoRow label="배송메모" value={order.shipping_memo} />}
                                                        </div>
                                                    </div>
                                                    {/* 변경 로그 */}
                                                    {logs.length > 0 && (
                                                        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                                                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>변경 이력</h3>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {logs.map((log, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(log.changedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>{log.changedBy}</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>:</span>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>{getStatusInfo(log.from).label}</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getStatusInfo(log.to).label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 우측: 상품+상태변경 */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {/* 주문 상품 */}
                                                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>주문 상품</h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                            {order.order_items?.map((item, idx) => (
                                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < (order.order_items?.length || 0) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                    <div>
                                                                        <span style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.product_title}</span>
                                                                        <div style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '8px' }}>
                                                                            {item.item_option?.color && <span>{item.item_option.color}</span>}
                                                                            {item.item_option?.size && <span>{item.item_option.size}</span>}
                                                                            <span>x{item.quantity}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{(item.price_at_purchase * item.quantity).toLocaleString()}원</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>합계</span>
                                                            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{order.total_amount?.toLocaleString()}원</span>
                                                        </div>
                                                    </div>
                                                    {/* 상태 변경 */}
                                                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>상태 변경</h3>
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <span style={{ fontSize: '18px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>현재 상태</span>
                                                            <span className={statusInfo.color} style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 18px', borderRadius: '10px', fontSize: '20px', fontWeight: 700 }}>{statusInfo.label}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {(NEXT_STATUS_MAP[order.status] || []).map(option => {
                                                                let btnStyle: React.CSSProperties = {};
                                                                if (option.type === 'normal') { btnStyle = { background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 700 }; }
                                                                else if (option.type === 'danger') { btnStyle = { background: 'transparent', color: '#EF4444', border: '1px solid #FCA5A5', fontWeight: 600 }; }
                                                                else { btnStyle = { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 500 }; }

                                                                return (
                                                                    <button key={option.value} onClick={(e) => { e.stopPropagation(); requestStatusChange(order.id, option.value); }} disabled={isUpdating} style={{ ...btnStyle, padding: '14px 20px', borderRadius: '12px', fontSize: '20px', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.5 : 1, transition: 'all 0.15s', textAlign: 'left' }}>
                                                                        {isUpdating ? '처리중...' : option.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
