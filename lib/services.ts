import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { defaultServices } from "@/lib/content";

export type Service = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_min: number;
  price_cents: number;
  currency: string;
  active: boolean;
  sort_order: number;
};

/**
 * Active services from Supabase, falling back to the canonical default service
 * when the database isn't configured or is empty (so the site always renders).
 */
export async function getActiveServices(): Promise<Service[]> {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) return data as Service[];
  }

  return defaultServices.map((s, i) => ({ ...s, id: `default-${i}` }));
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await getActiveServices();
  return services.find((s) => s.slug === slug) ?? null;
}
