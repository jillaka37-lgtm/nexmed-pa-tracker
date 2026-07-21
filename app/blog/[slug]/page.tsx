import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import { blogPostFromRow } from "@/lib/blog-agents/types";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? blogPostFromRow(data) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription ?? post.excerpt ?? undefined,
        datePublished: post.publishedAt ?? undefined,
      },
      post.faq.length > 0
        ? {
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }
        : null,
    ].filter(Boolean),
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarkdownArticle contentMd={post.contentMd} />

      {post.faq.length > 0 && (
        <div className="mt-12 border-t border-divider pt-8">
          <h2 className="mb-4 font-serif text-xl font-bold text-offwhite">Frequently asked questions</h2>
          <div className="space-y-4">
            {post.faq.map((f, i) => (
              <div key={i}>
                <p className="font-semibold text-offwhite">{f.question}</p>
                <p className="mt-1 text-sm text-muted">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
