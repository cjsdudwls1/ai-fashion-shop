// 상품 타입 정의

export interface ColorStock {
  color: string;
  quantity: number;
}

export interface SizeStock {
  size: string;
  quantity: number;
}

export type Gender = 'female' | 'male';

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  fabric: string;
  gender: Gender;
  colors: ColorStock[];
  sizes: SizeStock[];
  videoUrl: string | null;
  videoStatus: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
}

export interface ProductInput {
  name: string;
  imageBase64: string;
  fabric: string;
  gender: Gender;
  colorsText: string;
  sizesText: string;
}
