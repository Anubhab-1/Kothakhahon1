import { db } from "../lib/db";

async function main() {
  console.log("Enabling Row Level Security (RLS) on all public tables in Supabase...");

  await db.$executeRawUnsafe(`
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
            RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
        END LOOP;
    END $$;
  `);

  console.log("Successfully enabled RLS on all public tables!");
}

main()
  .catch((error) => {
    console.error("Failed to enable RLS:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
