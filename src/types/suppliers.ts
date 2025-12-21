export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    leadTime?: number; // Days to deliver
    orderDays?: number[]; // Days of week (0-6) they accept/deliver orders
    minimumOrderValue?: number; // Minimum monetary value for an order
    outletId?: string;

    // New fields for Automatic Purchases
    address?: string;
    taxId?: string; // NIF/CIF
    paymentTerms?: string; // e.g., "Net 30", "Immediate"
    deliveryWindows?: { start: string; end: string }[]; // e.g., "08:00"-"12:00"
}
