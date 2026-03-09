"use client";

import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { getStatusInfo } from '@/lib/orderUtils';
import DaumPostcode from 'react-daum-postcode';
import { Lock, ImageIcon, ShoppingBag } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const p = useProfile();

    if (p.loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-dark)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200"></div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-elevated)', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px 0' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '28px', letterSpacing: '-0.02em' }}>마이페이지</h1>

                {/* 탭 메뉴 */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', background: 'var(--bg-card)', borderRadius: '14px', padding: '5px', border: '1px solid var(--border-color)' }}>
                    {(['info', 'orders'] as const).map(tab => (
                        <button key={tab} onClick={() => p.setActiveTab(tab)} style={{
                            flex: 1, padding: '14px 0', fontSize: '16px',
                            fontWeight: p.activeTab === tab ? 700 : 500,
                            color: p.activeTab === tab ? 'var(--bg-dark)' : 'var(--text-primary)',
                            opacity: p.activeTab === tab ? 1 : 0.55,
                            background: p.activeTab === tab ? 'var(--text-primary)' : 'transparent',
                            borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}>
                            {tab === 'info' ? '회원 정보' : '주문 내역'}
                        </button>
                    ))}
                </div>

                {p.activeTab === 'info' ? (
                    <>
                        {/* 내 정보 관리 */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid var(--border-color)' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>내 정보 관리</h2>
                                {!p.isEditing && (
                                    <button onClick={() => p.setIsEditing(true)} className="hover:opacity-85 transition-opacity" style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}>수정하기</button>
                                )}
                            </div>

                            <div style={{ padding: '28px' }}>
                                {p.isEditing ? (
                                    <form onSubmit={p.handleUpdateProfile}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>아이디</label>
                                                <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '15px' }}>{p.profile?.username || p.user?.email?.split('@')[0] || '-'}</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>이름</label>
                                                <input type="text" value={p.editName} onChange={e => p.setEditName(e.target.value)} required style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>전화번호</label>
                                                <input type="tel" value={p.editPhone} onChange={e => p.setEditPhone(e.target.value)} required style={{ width: '100%', maxWidth: '320px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                            </div>
                                        </div>
                                        {/* 배송지 */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>배송지 정보</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" value={p.editZonecode} readOnly placeholder="우편번호" style={{ width: '120px', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none' }} />
                                                    <button type="button" onClick={() => p.setOpenPostcode(true)} style={{ padding: '14px 20px', background: 'var(--text-primary)', color: 'var(--bg-card)', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>주소 검색</button>
                                                </div>
                                                <input type="text" value={p.editRoadAddress} readOnly placeholder="도로명 주소" style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                                <input type="text" value={p.editDetailAddress} onChange={e => p.setEditDetailAddress(e.target.value)} placeholder="상세 주소 입력" style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '28px' }}>
                                            <button type="button" onClick={() => p.setIsEditing(false)} style={{ padding: '12px 28px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>취소</button>
                                            <button type="submit" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>저장하기</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>아이디</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.profile?.username || p.user?.email?.split('@')[0] || '-'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>이름</p>
                                                {p.profile?.full_name ? (
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.profile.full_name}</p>
                                                ) : (
                                                    <button onClick={() => p.setIsEditing(true)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>이름을 등록해주세요</button>
                                                )}
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>전화번호</p>
                                                {p.profile?.phone_number ? (
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.profile.phone_number}</p>
                                                ) : (
                                                    <button onClick={() => p.setIsEditing(true)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>전화번호를 등록해주세요</button>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>기본 배송지</h3>
                                            {p.address ? (
                                                <div style={{ background: 'var(--bg-elevated)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '11px', fontWeight: 700 }}>기본</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>[{p.address.zonecode}]</span>
                                                    </div>
                                                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{p.address.road_address}</p>
                                                    {p.address.detail_address && <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>{p.address.detail_address}</p>}
                                                </div>
                                            ) : (
                                                <button onClick={() => p.setIsEditing(true)} style={{ width: '100%', padding: '24px', borderRadius: '14px', border: '2px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>+ 배송지를 등록해주세요</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 비밀번호 변경 */}
                        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: p.isChangingPassword ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Lock size={18} stroke="var(--text-secondary)" strokeWidth={2} />
                                    </div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>비밀번호 변경</h2>
                                </div>
                                {!p.isChangingPassword && (
                                    <button onClick={() => { p.setIsChangingPassword(true); }} className="hover:opacity-85 transition-opacity" style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}>변경하기</button>
                                )}
                            </div>
                            {p.isChangingPassword && (
                                <form onSubmit={p.handleChangePassword} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>현재 비밀번호</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type={p.showCurrentPw ? 'text' : 'password'} required value={p.currentPassword} onChange={e => p.setCurrentPassword(e.target.value)} placeholder="현재 비밀번호 입력" style={{ width: '100%', padding: '14px 52px 14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                            <button type="button" onClick={() => p.setShowCurrentPw(!p.showCurrentPw)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.showCurrentPw ? '숨기기' : '보기'}</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>새 비밀번호</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type={p.showNewPw ? 'text' : 'password'} required minLength={6} value={p.newPassword} onChange={e => p.setNewPassword(e.target.value)} placeholder="새 비밀번호 (6자 이상)" style={{ width: '100%', padding: '14px 52px 14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                            <button type="button" onClick={() => p.setShowNewPw(!p.showNewPw)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.showNewPw ? '숨기기' : '보기'}</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>비밀번호 확인</label>
                                        <input type="password" required minLength={6} value={p.confirmPassword} onChange={e => p.setConfirmPassword(e.target.value)} placeholder="새 비밀번호 다시 입력" style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    {p.passwordMessage && (
                                        <div style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: p.passwordIsError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: p.passwordIsError ? '#ef4444' : '#16a34a', border: `1px solid ${p.passwordIsError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>{p.passwordMessage}</div>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <button type="button" onClick={p.resetPasswordForm} style={{ padding: '12px 24px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>취소</button>
                                        <button type="submit" disabled={p.passwordLoading} style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: p.passwordLoading ? 0.6 : 1 }}>{p.passwordLoading ? '변경 중...' : '변경 완료'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    /* 주문 내역 */
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>주문 내역</h2>
                        {p.orders.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {p.orders.map(order => {
                                    const statusInfo = getStatusInfo(order.status);
                                    return (
                                        <div key={order.id} style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.04)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>주문번호 #{order.guest_order_code || order.id.slice(0, 8)}</span>
                                                </div>
                                                <span className={statusInfo.color} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, lineHeight: '1.2' }}>{statusInfo.label}</span>
                                            </div>
                                            <div style={{ padding: '20px 24px' }}>
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx}>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                            <div style={{ width: '80px', height: '100px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#f5f5f5', border: '1px solid var(--border-color)' }}>
                                                                {item.product_image ? (
                                                                    <img src={item.product_image} alt={item.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <ImageIcon size={28} stroke="var(--text-muted)" strokeWidth={1.5} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.4 }}>{item.product_title}</p>
                                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                                    {item.item_option?.color && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>색상: {item.item_option.color}</span>}
                                                                    {item.item_option?.size && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>사이즈: {item.item_option.size}</span>}
                                                                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.quantity}개</span>
                                                                </div>
                                                                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{item.price_at_purchase.toLocaleString()}원</p>
                                                            </div>
                                                        </div>
                                                        {idx < (order.order_items?.length || 0) - 1 && <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ borderTop: '1px solid var(--border-color)', padding: '18px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>배송지</p>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{order.shipping_name}</p>
                                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{order.shipping_address}</p>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>총 결제금액</p>
                                                    <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{order.total_amount.toLocaleString()}원</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <ShoppingBag size={24} stroke="var(--text-muted)" strokeWidth={1.5} />
                                </div>
                                <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>아직 주문 내역이 없습니다.</p>
                                <button onClick={() => router.push('/products')} style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>쇼핑하러 가기</button>
                            </div>
                        )}
                    </div>
                )}

                {/* 우편번호 모달 */}
                {p.openPostcode && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '520px', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-elevated)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>주소 검색</h3>
                                <button onClick={() => p.setOpenPostcode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', fontSize: '18px' }}>✕</button>
                            </div>
                            <div style={{ height: '450px' }}>
                                <DaumPostcode onComplete={p.handleCompletePostcode} style={{ height: '100%' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
