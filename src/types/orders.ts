export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface OrderItem {
  id: string;
  pieceType: string;
  width: number;
  height: number;
  quantity: number;
  pricePerUnit: number;
  materialType?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date;
  notes?: string;
}

export interface Stock {
  id: string;
  materialType: string;
  width: number;
  height: number;
  thickness: number;
  quantity: number;
  location?: string;
  supplier?: string;
  purchaseDate?: Date;
  costPerUnit: number;
  notes?: string;
}

export interface OffCut {
  id: string;
  materialType: string;
  width: number;
  height: number;
  thickness: number;
  area: number;
  location?: string;
  sourceOrder?: string;
  createdAt: Date;
  isUsable: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}
