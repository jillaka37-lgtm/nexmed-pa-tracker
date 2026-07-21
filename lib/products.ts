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
    image_url: "https://images.pexels.com/photos/8509795/pexels-photo-8509795.jpeg?auto=compress&cs=tinysrgb&w=600",
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
    image_url: "https://images.pexels.com/photos/5207367/pexels-photo-5207367.jpeg?auto=compress&cs=tinysrgb&w=600",
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
    image_url: "https://images.pexels.com/photos/13534601/pexels-photo-13534601.jpeg?auto=compress&cs=tinysrgb&w=600",
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
    image_url: "https://images.pexels.com/photos/4114026/pexels-photo-4114026.jpeg?auto=compress&cs=tinysrgb&w=600",
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
    image_url: "https://images.pexels.com/photos/3873159/pexels-photo-3873159.jpeg?auto=compress&cs=tinysrgb&w=600",
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
    image_url: "https://images.pexels.com/photos/8538704/pexels-photo-8538704.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 150,
    active: true,
    sort_order: 6,
  },
  {
    slug: "omega-3-fish-oil",
    name: "Omega-3 Fish Oil 1000mg (60 capsules)",
    description: "High-strength fish oil for heart, brain, and joint health.",
    category: "Vitamins",
    price_cents: 1899,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/24554176/pexels-photo-24554176.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 100,
    active: true,
    sort_order: 7,
  },
  {
    slug: "vitamin-c-1000",
    name: "Vitamin C 1000mg (60 tablets)",
    description: "Immune-boosting antioxidant with sustained release formula.",
    category: "Vitamins",
    price_cents: 1299,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/3873134/pexels-photo-3873134.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 120,
    active: true,
    sort_order: 8,
  },
  {
    slug: "multivitamin-daily",
    name: "Daily Multivitamin (30 tablets)",
    description: "Complete A-Z formula covering all essential vitamins and minerals.",
    category: "Vitamins",
    price_cents: 1699,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/11363792/pexels-photo-11363792.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 100,
    active: true,
    sort_order: 9,
  },
  {
    slug: "blood-pressure-monitor",
    name: "Digital Blood Pressure Monitor",
    description: "Clinically validated arm cuff monitor with memory for 60 readings.",
    category: "Devices",
    price_cents: 3499,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/9951142/pexels-photo-9951142.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 30,
    active: true,
    sort_order: 10,
  },
  {
    slug: "pulse-oximeter",
    name: "Finger Pulse Oximeter",
    description: "Instant SpO₂ and pulse rate readings. Compact and easy to use.",
    category: "Devices",
    price_cents: 1999,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/8376218/pexels-photo-8376218.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 50,
    active: true,
    sort_order: 11,
  },
  {
    slug: "first-aid-kit",
    name: "First Aid Kit (85 pieces)",
    description: "Comprehensive kit for home and travel — bandages, antiseptic, gloves and more.",
    category: "Personal Care",
    price_cents: 2499,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/5149759/pexels-photo-5149759.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 60,
    active: true,
    sort_order: 12,
  },
  {
    slug: "sunscreen-spf50",
    name: "Moisturizing Sunscreen SPF 50 (100ml)",
    description: "Broad-spectrum UVA/UVB protection with hydrating formula. Water-resistant.",
    category: "Personal Care",
    price_cents: 1599,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/18323730/pexels-photo-18323730.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 80,
    active: true,
    sort_order: 13,
  },
  {
    slug: "antacid-tablets",
    name: "Antacid Chewable Tablets (48 tablets)",
    description: "Fast relief from heartburn, indigestion, and acid reflux.",
    category: "Digestive Health",
    price_cents: 799,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/4016655/pexels-photo-4016655.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 90,
    active: true,
    sort_order: 14,
  },
  {
    slug: "probiotic-capsules",
    name: "Probiotic 10 Billion CFU (30 capsules)",
    description: "Multi-strain formula for gut balance, digestion, and immune support.",
    category: "Digestive Health",
    price_cents: 2199,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/12955610/pexels-photo-12955610.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 70,
    active: true,
    sort_order: 15,
  },
  {
    slug: "sleep-aid",
    name: "Natural Sleep Aid 25mg (30 tablets)",
    description: "Non-habit-forming formula with melatonin for restful sleep.",
    category: "Sleep & Relaxation",
    price_cents: 1299,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/4062514/pexels-photo-4062514.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 80,
    active: true,
    sort_order: 16,
  },
  {
    slug: "glucose-monitor",
    name: "Blood Glucose Monitor Kit",
    description: "Accurate blood sugar readings in 5 seconds. Includes lancets and carrying case.",
    category: "Monitors",
    price_cents: 2999,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/6942248/pexels-photo-6942248.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 40,
    active: true,
    sort_order: 17,
  },
  {
    slug: "glucose-test-strips",
    name: "Blood Glucose Test Strips (50 count)",
    description: "Compatible with most major glucometers. Fast, reliable results.",
    category: "Monitors",
    price_cents: 1999,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/6823517/pexels-photo-6823517.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 80,
    active: true,
    sort_order: 18,
  },
  {
    slug: "birth-control-kit",
    name: "Birth Control Starter Kit",
    description: "Includes pregnancy test, ovulation strips, and a fertility tracking guide. Pharmacist-reviewed before dispatch.",
    category: "Women's Health",
    price_cents: 2499,
    currency: "usd",
    image_url: "https://images.pexels.com/photos/5974441/pexels-photo-5974441.jpeg?auto=compress&cs=tinysrgb&w=600",
    requires_rx: false,
    stock: 50,
    active: true,
    sort_order: 19,
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
