import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
  users,
  celebrities,
  vendors,
  events,
  bookings,
  payments,
  payouts,
  photos,
} from './schema';

// Zod schemas derived from Drizzle tables
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertCelebritySchema = createInsertSchema(celebrities);
export const selectCelebritySchema = createSelectSchema(celebrities);
export type InsertCelebrity = z.infer<typeof insertCelebritySchema>;
export type Celebrity = z.infer<typeof selectCelebritySchema>;

export const insertVendorSchema = createInsertSchema(vendors);
export const selectVendorSchema = createSelectSchema(vendors);
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = z.infer<typeof selectVendorSchema>;

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = z.infer<typeof selectEventSchema>;

export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = z.infer<typeof selectBookingSchema>;

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = z.infer<typeof selectPaymentSchema>;

export const insertPayoutSchema = createInsertSchema(payouts);
export const selectPayoutSchema = createSelectSchema(payouts);
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = z.infer<typeof selectPayoutSchema>;

export const insertPhotoSchema = createInsertSchema(photos);
export const selectPhotoSchema = createSelectSchema(photos);
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = z.infer<typeof selectPhotoSchema>;
