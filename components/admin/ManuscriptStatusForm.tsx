import { updateManuscriptStatusAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

const statuses = ["new", "in-review", "shortlisted", "accepted", "declined"];

export default function ManuscriptStatusForm({
  submissionId,
  currentStatus,
}: {
  submissionId: string;
  currentStatus: string;
}) {
  return (
    <form action={updateManuscriptStatusAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={submissionId} />
      <select name="status" className="admin-select min-w-[190px]" defaultValue={currentStatus}>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <AdminSubmitButton idleLabel="Save" pendingLabel="Saving..." />
    </form>
  );
}
