/*
  In-memory schedule and earnings store for celebrities.
  - 15-minute slot schedule with block/unblock
  - Non-overlapping live chat allocation
  - Basic earnings aggregation using live chat bookings and mock ticket shares
*/
import { randomUUID } from 'crypto';

export type SlotStatus = 'available' | 'blocked' | 'booked';

export type LiveChatBooking = {
  id: string;
  celebrityId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  durationMinutes: number; // default 15
  fanName: string;
  fanContact: string; // email or handle
  status: 'scheduled' | 'completed' | 'cancelled';
  amountCents: number;
  createdAt: number;
};

export type Payout = {
  id: string;
  celebrityId: string;
  amountCents: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: number;
};

export type TicketShare = {
  id: string;
  celebrityId: string;
  amountCents: number;
  createdAt: number;
};

const store = {
  bookings: [] as LiveChatBooking[],
  blocked: new Set<string>(), // key: celeb|date|time
  payouts: [] as Payout[],
  ticketShares: [] as TicketShare[],
};

function key(celebrityId: string, date: string, time: string) {
  return `${celebrityId}|${date}|${time}`;
}

export function resetCelebrityStore() {
  store.bookings = [];
  store.blocked = new Set();
  store.payouts = [];
  store.ticketShares = [];
}

export function seedCelebrityStore(celebrityId = 'celeb-1') {
  if (store.bookings.length || store.payouts.length) return; // seed once
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  // Two booked chats at 12:00 and 12:15
  const times = ['12:00', '12:15'];
  for (const [i, t] of times.entries()) {
    store.bookings.push({
      id: randomUUID(),
      celebrityId,
      date,
      time: t,
      durationMinutes: 15,
      fanName: i === 0 ? 'Alex Fan' : 'Bree Supporter',
      fanContact: i === 0 ? 'alex@example.com' : '@bree123',
      status: 'scheduled',
      amountCents: 2500,
      createdAt: Date.now(),
    });
  }
  // Block one slot at 10:30
  store.blocked.add(key(celebrityId, date, '10:30'));

  // Ticket share entries
  store.ticketShares.push(
    { id: randomUUID(), celebrityId, amountCents: 15000, createdAt: Date.now() - 86400000 * 3 },
    { id: randomUUID(), celebrityId, amountCents: 9000, createdAt: Date.now() - 86400000 * 1 },
  );
  // Payouts
  store.payouts.push(
    { id: randomUUID(), celebrityId, amountCents: 10000, status: 'paid', createdAt: Date.now() - 86400000 * 7 },
    { id: randomUUID(), celebrityId, amountCents: 8000, status: 'pending', createdAt: Date.now() - 86400000 * 2 },
  );
}

export function generateSlotsForDay(date: string, startHour = 10, endHour = 18) {
  const slots: { time: string }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push({ time: `${hh}:${mm}` });
    }
  }
  return slots;
}

export function getSchedule(celebrityId: string, date: string) {
  seedCelebrityStore(celebrityId);
  const slots = generateSlotsForDay(date);
  return slots.map((s) => {
    const booked = store.bookings.find((b) => b.celebrityId === celebrityId && b.date === date && b.time === s.time && b.status !== 'cancelled');
    const blocked = store.blocked.has(key(celebrityId, date, s.time));
    const status: SlotStatus = booked ? 'booked' : blocked ? 'blocked' : 'available';
    return {
      time: s.time,
      status,
      assigned: booked ? { fanName: booked.fanName, fanContact: booked.fanContact, bookingId: booked.id } : null,
    } as const;
  });
}

export function blockSlot(celebrityId: string, date: string, time: string) {
  // Cannot block a booked slot
  const isBooked = store.bookings.some((b) => b.celebrityId === celebrityId && b.date === date && b.time === time && b.status !== 'cancelled');
  if (isBooked) return false;
  store.blocked.add(key(celebrityId, date, time));
  return true;
}

export function unblockSlot(celebrityId: string, date: string, time: string) {
  store.blocked.delete(key(celebrityId, date, time));
  return true;
}

export function allocateLiveChatSlot(input: {
  celebrityId: string;
  date: string; // preferred date
  preferredTime?: string | null; // HH:MM
  fanName: string;
  fanContact: string;
  durationMinutes?: number;
  amountCents?: number;
}) {
  seedCelebrityStore(input.celebrityId);
  const duration = input.durationMinutes ?? 15;
  const slots = generateSlotsForDay(input.date);
  // Start index based on preferredTime
  let startIdx = 0;
  if (input.preferredTime) {
    startIdx = Math.max(0, slots.findIndex((s) => s.time === input.preferredTime));
    if (startIdx < 0) startIdx = 0;
  }
  // scan from preferred index to end, then from 0 to preferred-1
  const indices = [...Array(slots.length).keys()];
  const scanOrder = [...indices.slice(startIdx), ...indices.slice(0, startIdx)];
  for (const idx of scanOrder) {
    const time = slots[idx].time;
    if (!isSlotAvailable(input.celebrityId, input.date, time, duration)) continue;
    const booking: LiveChatBooking = {
      id: randomUUID(),
      celebrityId: input.celebrityId,
      date: input.date,
      time,
      durationMinutes: duration,
      fanName: input.fanName,
      fanContact: input.fanContact,
      status: 'scheduled',
      amountCents: input.amountCents ?? 2500,
      createdAt: Date.now(),
    };
    store.bookings.push(booking);
    return booking;
  }
  return null;
}

function isSlotAvailable(celebrityId: string, date: string, time: string, durationMinutes: number) {
  // For 15-min granularity, only check exact slot occupancy and block state
  const blocked = store.blocked.has(key(celebrityId, date, time));
  if (blocked) return false;
  const conflict = store.bookings.some((b) => b.celebrityId === celebrityId && b.date === date && b.time === time && b.status !== 'cancelled');
  if (conflict) return false;
  // If in future we support >15min durations, ensure contiguous slots free
  if (durationMinutes > 15) {
    const needed = Math.ceil(durationMinutes / 15);
    const slots = generateSlotsForDay(date);
    const idx = slots.findIndex((s) => s.time === time);
    if (idx === -1) return false;
    for (let i = 0; i < needed; i++) {
      const s = slots[idx + i];
      if (!s) return false;
      const t = s.time;
      if (store.blocked.has(key(celebrityId, date, t))) return false;
      if (store.bookings.some((b) => b.celebrityId === celebrityId && b.date === date && b.time === t && b.status !== 'cancelled')) return false;
    }
  }
  return true;
}

export function listLiveChatBookings(celebrityId: string) {
  seedCelebrityStore(celebrityId);
  return store.bookings.filter((b) => b.celebrityId === celebrityId);
}

export function getEarningsSummary(celebrityId: string) {
  seedCelebrityStore(celebrityId);
  const ticketsTotal = store.ticketShares.filter((t) => t.celebrityId === celebrityId).reduce((sum, t) => sum + t.amountCents, 0);
  const liveChatTotal = store.bookings
    .filter((b) => b.celebrityId === celebrityId && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.amountCents, 0);
  const paid = store.payouts.filter((p) => p.celebrityId === celebrityId && p.status === 'paid').reduce((sum, p) => sum + p.amountCents, 0);
  const pending = store.payouts.filter((p) => p.celebrityId === celebrityId && p.status === 'pending').reduce((sum, p) => sum + p.amountCents, 0);
  return {
    ticketsTotalCents: ticketsTotal,
    liveChatTotalCents: liveChatTotal,
    payouts: {
      paidCents: paid,
      pendingCents: pending,
    },
  };
}
