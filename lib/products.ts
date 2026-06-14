import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  requires_rx: boolean;
  stock: number;
  active: boolean;
  sort_order: number;
};

/** Sample catalog shown before the database is configured (mirrors 0005 seed). */
export const defaultProducts: Omit<Product, "id">[] = [
  {
    slug: "pain-relief-500",
    name: "Pain Relief 500mg (24 tablets)",
    description: "Fast-acting relief for headaches, aches, and pains.",
    category: "Pain & Fever",
    price_cents: 799,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 100,
    active: true,
    sort_order: 1,
  },
  {
    slug: "allergy-relief",
    name: "Allergy Relief 10mg (30 tablets)",
    description: "Non-drowsy antihistamine for hay fever and allergies.",
    category: "Allergy",
    price_cents: 1199,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 80,
    active: true,
    sort_order: 2,
  },
  {
    slug: "vitamin-d3",
    name: "Vitamin D3 1000 IU (90 capsules)",
    description: "Daily support for bones, teeth, and immune health.",
    category: "Vitamins",
    price_cents: 1499,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 120,
    active: true,
    sort_order: 3,
  },
  {
    slug: "cold-flu-relief",
    name: "Cold & Flu Relief Sachets (10 pack)",
    description: "Warming blackcurrant sachets to ease cold and flu symptoms.",
    category: "Cold & Flu",
    price_cents: 899,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 90,
    active: true,
    sort_order: 4,
  },
  {
    slug: "digital-thermometer",
    name: "Digital Thermometer",
    description: "Fast, accurate temperature readings for the whole family.",
    category: "Devices",
    price_cents: 1299,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 40,
    active: true,
    sort_order: 5,
  },
  {
    slug: "hand-sanitizer",
    name: "Hand Sanitizer Gel (250ml)",
    description: "Kills 99.9% of germs; with moisturizing aloe vera.",
    category: "Personal Care",
    price_cents: 499,
    currency: "usd",
    image_url: null,
    requires_rx: false,
    stock: 150,
    active: true,
    sort_order: 6,
  },
];

export async function getActiveProducts(): Promise<Product[]> {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) return data as Product[];
  }
  return defaultProducts.map((p, i) => ({ ...p, id: `default-${i}` }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getActiveProducts();
  return products.find((p) => p.slug === slug) ?? null;
}
