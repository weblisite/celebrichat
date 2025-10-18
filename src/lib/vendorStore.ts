/*
  In-memory store for vendor applications, approvals, fees, and event assets.
  This avoids external DBs during local/dev/e2e while providing a realistic API surface.
*/
import { randomUUID } from 'crypto';

export type VendorStatus = 'pending' | 'active' | 'suspended';

export type VendorApplication = {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string;
  status: VendorStatus;
  feeCents: number; // outstanding fee to activate vendor for the event
  paid: boolean;
  eventAssets: { name: string; url: string }[];
  instructions: string[];
  createdAt: number;
  updatedAt: number;
};

const store = {
  vendors: [] as VendorApplication[],
};

function now() {
  return Date.now();
}

export function listVendors() {
  return store.vendors.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function getVendorById(id: string) {
  return store.vendors.find((v) => v.id === id) || null;
}

export function getVendorByEmail(email: string) {
  return store.vendors.find((v) => v.contactEmail.toLowerCase() === email.toLowerCase()) || null;
}

export function applyVendor(input: {
  companyName: string;
  contactEmail: string;
  contactName: string;
}) {
  const existing = getVendorByEmail(input.contactEmail);
  if (existing) return existing;
  const id = randomUUID();
  const vendor: VendorApplication = {
    id,
    companyName: input.companyName,
    contactEmail: input.contactEmail,
    contactName: input.contactName,
    status: 'pending',
    feeCents: 0,
    paid: false,
    eventAssets: [],
    instructions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  store.vendors.push(vendor);
  return vendor;
}

export function approveVendor(id: string, options?: { feeCents?: number }) {
  const vendor = getVendorById(id);
  if (!vendor) return null;
  vendor.status = 'active';
  vendor.feeCents = typeof options?.feeCents === 'number' ? options.feeCents : 50000; // default $500.00
  vendor.paid = false;
  vendor.eventAssets = [
    { name: 'Event Floorplan (PDF)', url: '/assets/event-floorplan.pdf' },
    { name: 'Vendor Badge Template (PNG)', url: '/assets/vendor-badge-template.png' },
  ];
  vendor.instructions = [
    'Arrive 2 hours before doors open for setup.',
    'Bring a government-issued ID matching your registration.',
    'Check in at the Vendor Desk located at the main entrance.',
    'Follow on-site staff instructions for booth allocation and safety.',
  ];
  vendor.updatedAt = now();
  return vendor;
}

export function markVendorPaid(id: string) {
  const vendor = getVendorById(id);
  if (!vendor) return null;
  vendor.paid = true;
  vendor.updatedAt = now();
  return vendor;
}

export function resetStore() {
  store.vendors = [];
}
