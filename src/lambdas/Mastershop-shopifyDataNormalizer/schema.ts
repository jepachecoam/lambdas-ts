import { z } from "zod";

const AddressSchema = z.object({
  country: z.string(),
  city: z.string(),
  address1: z.string(),
  address2: z.string().nullable().default(null),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  first_name: z.string().nullable().default(null),
  last_name: z.string().nullable().default(null),
  full_name: z.string(),
  phone: z.string().nullable(),
  state: z.string(),
  state_code: z.string().nullable().default(null)
});

const CustomerSchema = z.object({
  full_name: z.string(),
  first_name: z.string().nullable().default(null),
  last_name: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  documentType: z.string().nullable().default(null),
  documentNumber: z.string().nullable().default(null)
});

const LineItemsSchema = z.array(
  z.object({
    name: z.string(),
    current_quantity: z.number(),
    grams: z.number(),
    price: z.number(),
    title: z.string(),
    product_id: z.number(),
    variant_id: z.number(),
    discount_allocations: z.any()
  })
);

export const ShopifyDataSchema = z.object({
  total_shipping_price_set: z.number().optional().default(0),
  billing_address: AddressSchema,
  shipping_address: AddressSchema,
  customer: CustomerSchema,
  notes: z.array(z.string()).nullable().default([]),
  tags: z.array(z.string()).nullable().default([]),
  payment_method: z.string(),
  line_items: LineItemsSchema,
  total_discounts: z.string().nullable().default(null),
  total_price: z.string().nullable().default(null)
});

export type OrderSchemaExpected = z.infer<typeof ShopifyDataSchema>;
