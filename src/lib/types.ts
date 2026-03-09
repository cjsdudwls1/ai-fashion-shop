// 역할 타입 정의
export type UserRole = 'user' | 'admin';

// 상품 타입 정의

export interface ColorStock {
  color: string;
  quantity: number;
}

export interface SizeStock {
  size: string;
  quantity: number;
}

export type Gender = 'female' | 'male' | 'unisex';

export interface AiMedia {
  id: string;
  gender: 'male' | 'female';
  mediaType: 'image' | 'video';
  url: string;
}

export interface Product {
  id: string;
  name: string;
  fabric: string;
  gender: Gender;
  category?: string; // 카테고리
  colors: ColorStock[];
  sizes: SizeStock[];
  imageUrl: string; // 대표 이미지
  galleryImages: { url: string; color?: string; isPrimary?: boolean }[]; // 갤러리 이미지
  videoUrl: string | null;
  audioUrl: string | null;       // TTS 나레이션 오디오 (Base64 Data URL)
  // [2026-03-08] tryon_polling, video_polling 유령 상태 제거
  // 설정하는 코드가 전체 코드베이스에 존재하지 않는 레거시 잔재.
  // 근거: .docs/veo-pipeline-structural-analysis.md 결함 F
  videoStatus: 'pending' | 'generating' | 'generating_male' | 'completed' | 'failed';
  klingTaskId?: string | null;
  tryOnImageUrl?: string | null;
  displayImageUrl?: string | null; // AI 생성 소비자용 대표 이미지
  videoErrorReason?: string; // 영상 생성 오류 메시지
  price?: number;
  createdAt: Date;
  deletedAt?: Date | null; // 소프트 삭제용
  mediaGenerationType?: 'video' | 'image' | 'none'; // 미디어 생성 타입
  aiMedia?: AiMedia[]; // 남녀공용 상품의 성별별 AI 시각자료
  narrationText?: string | null; // AI 영상 모델 대사
  videoModel?: string | null; // AI 영상 생성 모델
  videoStartedAt?: Date | null; // 영상 생성 시작 시각 (타임아웃 검사용)
}

// 상품 상세 페이지 갤러리용 이미지 타입
export interface GalleryImage {
  url: string;
  isPrimary?: boolean;
  color?: string;
  isAI?: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  is_setup_finished: boolean;
  role: UserRole;
  updated_at?: string;
}
