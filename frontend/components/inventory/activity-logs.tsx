import {
  BadgeCheck,
  Clock3,
  FileClock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ActivityLog, ActivityLogAction } from "@/lib/api";

type ActivityLogsProps = {
  activityLogs: ActivityLog[];
  error: string;
  isLoading: boolean;
  onRetry: () => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function ActivityLogs({
  activityLogs,
  error,
  isLoading,
  onRetry,
}: ActivityLogsProps) {
  return (
    <section className="h-full overflow-y-auto pb-4">
      <article className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white shadow-[0_10px_30px_rgba(23,59,36,0.035)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e1] px-5 py-5 sm:items-center sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e7f2e6] text-[#2f7043]">
                <FileClock size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-black">Activity Logs</h2>
                <p className="mt-0.5 text-sm text-[#7a857d]">
                  Successful changes made by signed-in admins
                </p>
              </div>
            </div>
          </div>
          {!isLoading && !error && (
            <span className="shrink-0 rounded-full bg-[#edf4ed] px-3 py-1.5 text-xs font-black text-[#2f7043]">
              {activityLogs.length} {activityLogs.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>

        {isLoading && <ActivityLogsLoading />}

        {!isLoading && error && (
          <div
            className="m-5 flex flex-col gap-3 rounded-xl bg-[#fff0e8] px-4 py-4 text-sm text-[#8f421f] sm:m-6 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 font-black shadow-sm"
            >
              <RotateCcw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {!isLoading && !error && activityLogs.length > 0 && (
          <div>
            <div className="hidden grid-cols-[8rem_minmax(0,1.5fr)_minmax(12rem,1fr)_12rem] gap-4 border-b border-[#e8ede6] bg-[#f7f9f6] px-6 py-3 text-xs font-black uppercase tracking-wide text-[#77837a] md:grid">
              <span>Action</span>
              <span>Affected record</span>
              <span>Admin</span>
              <span>Date &amp; time</span>
            </div>
            {activityLogs.map((activityLog) => (
              <ActivityLogRow activityLog={activityLog} key={activityLog.id} />
            ))}
          </div>
        )}

        {!isLoading && !error && activityLogs.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf2eb] text-[#52705b]">
              <FileClock size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-black text-[#24362a]">
              No activity recorded yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c867e]">
              New inventory, sales, returns, edits, and deletions will appear
              here after they are completed.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

function ActivityLogRow({ activityLog }: { activityLog: ActivityLog }) {
  const style = getActionStyle(activityLog.action);

  return (
    <div className="grid gap-4 border-b border-[#e8ede6] px-5 py-4 last:border-b-0 md:grid-cols-[8rem_minmax(0,1.5fr)_minmax(12rem,1fr)_12rem] md:items-center md:px-6">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black capitalize ${style.className}`}
      >
        {style.icon}
        {activityLog.action}
      </span>

      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
          Affected record
        </p>
        <p className="break-words text-sm font-extrabold text-[#24362a]">
          {activityLog.affectedRecord.replace(/ #?\d+ — /, " — ")}
        </p>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
          Admin
        </p>
        <p className="flex items-center gap-2 break-all text-sm font-semibold text-[#5f6d63]">
          <UserRound className="shrink-0" size={16} aria-hidden="true" />
          {activityLog.adminEmail}
        </p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
          Date &amp; time
        </p>
        <p className="flex items-center gap-2 text-sm font-semibold text-[#5f6d63]">
          <Clock3 className="shrink-0" size={16} aria-hidden="true" />
          <time dateTime={activityLog.createdAt}>
            {dateTimeFormatter.format(new Date(activityLog.createdAt))}
          </time>
        </p>
      </div>
    </div>
  );
}

function ActivityLogsLoading() {
  return (
    <div className="space-y-3 p-5 sm:p-6" role="status">
      <span className="sr-only">Loading activity logs</span>
      {[0, 1, 2, 3].map((item) => (
        <div
          className="h-20 animate-pulse rounded-xl bg-[#edf1eb]"
          key={item}
        />
      ))}
    </div>
  );
}

function getActionStyle(action: ActivityLogAction) {
  if (action === "added") {
    return {
      className: "bg-[#e7f2e6] text-[#2f7043]",
      icon: <Plus size={14} aria-hidden="true" />,
    };
  }
  if (action === "edited") {
    return {
      className: "bg-[#e9eef8] text-[#4566a0]",
      icon: <Pencil size={13} aria-hidden="true" />,
    };
  }
  if (action === "approved") {
    return {
      className: "bg-[#e7f2e6] text-[#2f7043]",
      icon: <BadgeCheck size={14} aria-hidden="true" />,
    };
  }
  return {
    className: "bg-[#fff0e8] text-[#9b431f]",
    icon: <Trash2 size={14} aria-hidden="true" />,
  };
}
