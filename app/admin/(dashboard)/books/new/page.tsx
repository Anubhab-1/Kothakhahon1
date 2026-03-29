import AdminNotice from "@/components/admin/AdminNotice";
import BookEditor from "@/components/admin/BookEditor";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";

interface AdminNewBookPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminNewBookPage({ searchParams }: AdminNewBookPageProps) {
  const [params, authors] = await Promise.all([
    searchParams,
    db.author.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Books"
        title="Add A New Title"
        description="Create a catalog entry that is ready for storefront display and checkout."
      />
      <AdminNotice error={params.error} />
      <BookEditor authors={authors.map((author) => ({ id: author.id, name: author.name }))} />
    </div>
  );
}
