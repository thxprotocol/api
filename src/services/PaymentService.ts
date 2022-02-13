import { Payment } from '../models/Payment';
import { IPaymentData } from '../interfaces/IPaymentData';

function createPayment(data: IPaymentData) {
    return Payment.create(data);
}

export { createPayment };
