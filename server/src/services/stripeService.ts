import Stripe from 'stripe';
import { Booking } from '../models/Booking';
import { AppError } from '../utils/appError';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_localpro';
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

export const createCheckoutSession = async (
  bookingId: string,
  serviceTitle: string,
  amount: number,
  customerEmail?: string
): Promise<{ sessionId: string; sessionUrl: string | null }> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // If secret key is mock test or Stripe not configured with real key, support mock checkout
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('mock')) {
    const mockSessionId = `cs_test_mock_${Date.now()}_${bookingId}`;
    await Booking.findByIdAndUpdate(bookingId, {
      stripeSessionId: mockSessionId,
    });
    return {
      sessionId: mockSessionId,
      sessionUrl: `${clientUrl}/customer/bookings?session_id=${mockSessionId}&mock_success=true&booking_id=${bookingId}`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceTitle,
            description: `Appointment service via LocalPro (Booking #${bookingId})`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId,
    },
    success_url: `${clientUrl}/customer/bookings?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
    cancel_url: `${clientUrl}/customer/bookings?canceled=true&booking_id=${bookingId}`,
  });

  await Booking.findByIdAndUpdate(bookingId, {
    stripeSessionId: session.id,
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url,
  };
};

export const verifyAndConfirmPayment = async (
  bookingId: string,
  sessionId: string
): Promise<boolean> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  // If mock session
  if (sessionId.includes('mock') || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('mock')) {
    booking.paymentStatus = 'PAID';
    booking.status = 'CONFIRMED';
    booking.stripePaymentIntentId = `pi_mock_${Date.now()}`;
    await booking.save();
    return true;
  }

  // Retrieve actual Stripe session
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === 'paid') {
    booking.paymentStatus = 'PAID';
    booking.status = 'CONFIRMED';
    booking.stripePaymentIntentId = String(session.payment_intent || '');
    await booking.save();
    return true;
  }

  return false;
};
