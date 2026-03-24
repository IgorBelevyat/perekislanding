import { z } from 'zod';

// Phone: Ukrainian format normalization
const phoneSchema = z
    .string()
    .transform((val) => val.replace(/[\s\-\(\)]/g, ''))
    .pipe(
        z
            .string()
            .regex(/^(\+?380|0)\d{9}$/, 'Invalid Ukrainian phone number')
            .transform(val => {
                if (val.startsWith('0')) return '+38' + val;
                if (val.startsWith('380')) return '+' + val;
                return val;
            })
    );

// ─── Customer schema ──────────────────────────────────────
const customerSchema = z.object({
    firstName: z.string().min(2).max(50).trim(),
    lastName: z.string().min(2).max(50).trim(),
    phone: phoneSchema,
    email: z.string().email().optional().or(z.literal('')),
    companyName: z.string().min(2).max(100).trim().optional(),
    edrpou: z.string().min(8).max(10).trim().optional(),
});

// ─── Delivery schema ─────────────────────────────────────
const deliverySchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('nova_poshta'),
        cityRef: z.string().min(1).max(100),
        warehouseRef: z.string().min(1).max(100),
        cityName: z.string().max(200),
        warehouseName: z.string().max(500),
    }),
    z.object({
        type: z.literal('courier'),
        city: z.string().min(1).max(100),
        street: z.string().min(1).max(200),
        house: z.string().min(1).max(50),
        entrance: z.string().max(50).optional().or(z.literal('')),
        apartment: z.string().max(50).optional().or(z.literal('')),
    }),
    z.object({
        type: z.literal('pickup'),
    }),
]);

// ─── Payment method ───────────────────────────────────────
const paymentMethodSchema = z.enum(['online', 'cod', 'cashless']);

// ─── Checkout request schema ──────────────────────────────
export const checkoutRequestSchema = z.object({
    quoteId: z.string().uuid(),
    customer: customerSchema,
    delivery: deliverySchema,
    paymentMethod: paymentMethodSchema,
}).superRefine((data, ctx) => {
    if (data.delivery.type === 'pickup' && data.paymentMethod !== 'online') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Самовивіз можливий лише за умови онлайн оплати",
            path: ['paymentMethod'],
        });
    }
    if (data.paymentMethod === 'cashless') {
        if (!data.customer.companyName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введіть назву організації", path: ['customer', 'companyName'] });
        }
        if (!data.customer.edrpou) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введіть ЄДРПОУ", path: ['customer', 'edrpou'] });
        }
    }
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
