export class PaymentProcessDto {
  orderId: string;
  method: 'COD' | 'VNPay' | 'Stripe' | 'SePay';
  amount: number;
}

export class PaymentVerifyDto {
  orderId: string;
  payload: any;
}

export class PaymentIdDto {
  id: string;
}

export class PaymentByOrderDto {
  orderId: string;
}
