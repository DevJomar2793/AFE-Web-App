import {
  CalendarClock,
  Check,
  LoaderCircle,
  RotateCcw,
  UserCheck,
  UserRound,
} from "lucide-react";
import type { PendingAccount } from "@/lib/api";

type AccountApprovalProps = {
  accounts: PendingAccount[];
  approvalError: string;
  approvingUserId: number | null;
  error: string;
  isLoading: boolean;
  onApprove: (account: PendingAccount) => void;
  onRetry: () => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function AccountApproval({
  accounts,
  approvalError,
  approvingUserId,
  error,
  isLoading,
  onApprove,
  onRetry,
}: AccountApprovalProps) {
  return (
    <section className="h-full overflow-y-auto pb-4">
      <article className="overflow-hidden rounded-2xl border border-[#dce3da] bg-white shadow-[0_10px_30px_rgba(23,59,36,0.035)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e1] px-5 py-5 sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f2e6] text-[#2f7043]">
              <UserCheck size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black">Account Approval</h2>
              <p className="mt-0.5 text-sm text-[#7a857d]">
                Review new accounts before they can sign in
              </p>
            </div>
          </div>
          {!isLoading && !error && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-[#fff0e5] px-3 py-1.5 text-xs font-black text-[#a85620]">
                {accounts.length} pending
              </span>
              <button
                type="button"
                onClick={onRetry}
                aria-label="Refresh pending accounts"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dce3da] px-3 text-xs font-bold text-[#536257] transition hover:bg-[#f7f9f6]"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          )}
        </div>

        {isLoading && <AccountApprovalLoading />}

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

        {!isLoading && !error && approvalError && (
          <p
            className="mx-5 mt-5 rounded-xl bg-[#fff0e8] px-4 py-3 text-sm font-bold text-[#8f421f] sm:mx-6"
            role="alert"
          >
            {approvalError}
          </p>
        )}

        {!isLoading && !error && accounts.length > 0 && (
          <div>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_13rem_7rem_8rem] gap-4 border-b border-[#e8ede6] bg-[#f7f9f6] px-6 py-3 text-xs font-black uppercase tracking-wide text-[#77837a] md:grid">
              <span>Account</span>
              <span>Registered</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {accounts.map((account) => {
              const isApproving = approvingUserId === account.id;
              return (
                <div
                  className="grid gap-4 border-b border-[#e8ede6] px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_13rem_7rem_8rem] md:items-center md:px-6"
                  key={account.id}
                  aria-busy={isApproving}
                >
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
                      Account
                    </p>
                    <p className="flex items-center gap-2 break-all text-sm font-extrabold text-[#24362a]">
                      <UserRound className="shrink-0" size={17} aria-hidden="true" />
                      {account.email}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
                      Registered
                    </p>
                    <p className="flex items-center gap-2 text-sm font-semibold text-[#5f6d63]">
                      <CalendarClock className="shrink-0" size={16} aria-hidden="true" />
                      <time dateTime={account.createdAt}>
                        {dateTimeFormatter.format(new Date(account.createdAt))}
                      </time>
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#8a938c] md:hidden">
                      Status
                    </p>
                    <span className="inline-flex rounded-full bg-[#fff0e5] px-3 py-1.5 text-xs font-black text-[#a85620]">
                      Pending
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={approvingUserId !== null}
                    aria-label={`Approve account for ${account.email}`}
                    onClick={() => onApprove(account)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173b24] px-4 text-sm font-black text-white transition hover:bg-[#245334] disabled:cursor-wait disabled:opacity-60 md:justify-self-end"
                  >
                    {isApproving ? (
                      <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                    ) : (
                      <Check size={16} aria-hidden="true" />
                    )}
                    {isApproving ? "Approving..." : "Approve"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && accounts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f2e6] text-[#2f7043]">
              <UserCheck size={25} aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-black text-[#24362a]">
              No accounts waiting for approval
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c867e]">
              New registrations will appear here for an administrator to review.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

function AccountApprovalLoading() {
  return (
    <div className="space-y-3 p-5 sm:p-6" role="status">
      <span className="sr-only">Loading pending accounts</span>
      {[0, 1, 2].map((item) => (
        <div className="h-20 animate-pulse rounded-xl bg-[#edf1eb]" key={item} />
      ))}
    </div>
  );
}
