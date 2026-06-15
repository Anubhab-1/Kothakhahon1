import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { retryEmailJobAction, triggerEmailQueueDrainAction } from "@/app/admin/actions";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";

interface EmailJobsPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
}

export default async function AdminEmailJobsPage({ searchParams }: EmailJobsPageProps) {
  const [params, totalQueued, totalProcessing, totalCompleted, totalFailed, jobs] = await Promise.all([
    searchParams,
    db.emailJob.count({ where: { status: "queued" } }),
    db.emailJob.count({ where: { status: "processing" } }),
    db.emailJob.count({ where: { status: "completed" } }),
    db.emailJob.count({ where: { status: "failed" } }),
    db.emailJob.findMany({
      orderBy: [
        { status: "asc" }, // Show queued and failed first
        { runAt: "asc" },
      ],
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader
          eyebrow="Operations"
          title="Email Queue Manager"
          description="Monitor background email delivery statuses, analyze execution failures, and manually retry pending jobs."
        />
        <form action={triggerEmailQueueDrainAction}>
          <button
            type="submit"
            className="rounded-full bg-brass/10 border border-brass/30 px-5 py-2.5 font-ui text-xs tracking-wider text-brass hover:bg-brass hover:text-white transition duration-200"
          >
            DRAIN QUEUE NOW
          </button>
        </form>
      </div>

      <AdminNotice notice={params.notice} error={params.error} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Queued" value={String(totalQueued)} hint="Jobs scheduled to run or retrying soon." />
        <AdminStatCard label="Processing" value={String(totalProcessing)} hint="Jobs currently locked and executing." />
        <AdminStatCard label="Completed" value={String(totalCompleted)} hint="Jobs executed successfully." />
        <AdminStatCard label="Failed" value={String(totalFailed)} hint="Jobs that exceeded max retry attempts." />
      </section>

      <section className="admin-card">
        <p className="admin-eyebrow">Queue Roster</p>
        <h2 className="mt-2 font-title text-4xl text-ink">Recent and active email jobs</h2>
        
        <div className="mt-6 overflow-hidden rounded-[24px] border border-ink/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job Details</th>
                <th>Status / Try</th>
                <th>Run Scheduled</th>
                <th>Last Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="space-y-1">
                      <div className="font-mono text-xs text-ink/75">{job.id}</div>
                      <div className="font-ui text-[11px] tracking-wide text-brass font-semibold">
                        {job.type.toUpperCase().replace(/_/g, " ")}
                      </div>
                      {job.dedupeKey && (
                        <div className="font-mono text-[10px] text-ink/45">
                          Dedupe: {job.dedupeKey}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`rounded-full px-2 py-0.5 font-ui text-[10px] tracking-wider font-semibold ${
                            job.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : job.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : job.status === "processing"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {job.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] text-ink/50">
                          Try {job.attempts} of {job.maxAttempts}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-body text-sm text-ink/70">
                        {job.runAt.toLocaleString("en-IN")}
                      </div>
                      <div className="font-mono text-[10px] text-ink/40">
                        Created: {job.createdAt.toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="max-w-[280px]">
                      {job.lastError ? (
                        <div className="font-mono text-xs text-red-700 bg-red-50 p-2 rounded-md max-h-[80px] overflow-y-auto whitespace-pre-wrap">
                          {job.lastError}
                        </div>
                      ) : (
                        <span className="text-sm text-ink/40 font-body">None</span>
                      )}
                    </td>
                    <td>
                      {(job.status === "failed" || job.status === "completed" || job.attempts > 0) ? (
                        <form action={retryEmailJobAction}>
                          <input type="hidden" name="id" value={job.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-ink/20 px-3 py-1 font-ui text-[10px] tracking-wider text-ink transition hover:border-brass hover:text-brass hover:bg-brass/5"
                          >
                            RETRY JOB
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-ink/40 font-body">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center font-body py-8 text-ink/50">
                    No email jobs found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
