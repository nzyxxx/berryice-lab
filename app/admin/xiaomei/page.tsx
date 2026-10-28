import { isAdminRequest } from "@/lib/api/admin-auth";
import { xiaomeiPublicStatus } from "@/lib/xiaomei-chat-server";
import { XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import { isWikiAdminAuthorized } from "@/lib/content/wiki-auth";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${XIAOMEI_NAME}状态`,
  robots: { index: false, follow: false },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3">
      <dt className="text-sm text-lab-ink-subtle">{label}</dt>
      <dd className="text-sm text-lab-ink">{value}</dd>
    </div>
  );
}

export default async function XiaomeiStatusPage() {
  const incoming = await headers();
  const bag = new Headers();
  incoming.forEach((value, key) => bag.set(key, value));
  const request = new Request("http://127.0.0.1/admin/xiaomei", { headers: bag });
  const allowed = isAdminRequest(request) || isWikiAdminAuthorized(request);

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16 text-lab-ink">
      <h1 className="text-2xl font-semibold tracking-tight">{XIAOMEI_NAME}</h1>
      <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">
        钥匙只放在服务器的环境变量里。这一页不能填，也不会显示。
      </p>
      {!allowed ? (
        <p className="mt-8 text-sm text-lab-ink">未授权。用已经登录的站长会话再来。</p>
      ) : (
        <StatusList />
      )}
    </main>
  );
}

function StatusList() {
  const status = xiaomeiPublicStatus();
  const flag = (on: boolean) => (on ? "已配置" : "未配置");
  return (
    <dl className="mt-8">
      <Row label="主钥匙" value={flag(status.configuredPrimary)} />
      <Row label="备用钥匙" value={flag(status.configuredBackup)} />
      <Row label="模型" value={status.model} />
      <Row label="主机" value={status.baseUrlHost || "—"} />
      <Row label="对话" value={status.chatDisabled ? "已按停" : "开着"} />
      <Row
        label="今日用量"
        value={
          status.dailyTokenBudget
            ? `${status.dailyTokensUsed} / ${status.dailyTokenBudget}`
            : `${status.dailyTokensUsed}（没设上限）`
        }
      />
    </dl>
  );
}
