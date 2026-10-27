"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

const TOKEN_KEY = "berryice.wiki.adminToken";
const DELETE_TIMEOUT_MS = 15_000;

type Step = "token" | "confirm";

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function writeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "TimeoutError"
  );
}

/**
 * 删除一篇笔记。口令只留在这台浏览器，请求时放进 Authorization。
 * 确认之后才发请求；请求没回来之前锁住，连点不会打出第二下。
 *
 * 触发器保持安静。破坏性只出现在确认这一步，而且是描边次按钮，不是整条红底。
 */
export function WikiDeleteButton({
  slug,
  title,
  redirectTo,
  appearance,
  className,
}: {
  slug: string;
  title: string;
  redirectTo?: string;
  appearance: "row" | "footer";
  className?: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [tokenDraft, setTokenDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = `删除「${title}」`;

  function openFlow() {
    if (lock.current) return;
    setError(null);
    setTokenDraft("");
    setStep(readToken() ? "confirm" : "token");
    setOpen(true);
  }

  function close() {
    if (busy) return;
    setOpen(false);
  }

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = tokenDraft.trim();
    if (!next) {
      setError("先填口令");
      return;
    }
    try {
      writeToken(next);
    } catch {
      setError("这个浏览器存不住口令");
      return;
    }
    setError(null);
    setStep("confirm");
  }

  function replaceToken() {
    if (busy) return;
    try {
      clearToken();
    } catch {
      setError("清不掉已存的口令");
      return;
    }
    setTokenDraft("");
    setError(null);
    setStep("token");
  }

  async function confirmDelete() {
    if (lock.current) return;
    const token = readToken();
    if (!token) {
      setStep("token");
      return;
    }

    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/wiki/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(DELETE_TIMEOUT_MS),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (response.status === 401) {
        try {
          clearToken();
        } catch {
          /* 清不掉也要让人重输 */
        }
        setStep("token");
        setError("口令不对，或服务器还没配 WIKI_ADMIN_TOKEN");
        return;
      }

      if (!response.ok || payload?.ok !== true) {
        setError(payload?.message || "没删掉，稍后再试");
        return;
      }

      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setError(isTimeout(error) ? "请求超时，笔记还在" : "网络中断了，笔记还在");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openFlow}
        aria-label={label}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-full text-lab-ink-subtle",
          "transition-colors hover:bg-lab-surface-3 hover:text-lab-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
          appearance === "row" ? "size-11" : "gap-2 px-3 text-sm",
          className
        )}
      >
        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
        {appearance === "footer" ? <span>删除</span> : null}
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else close();
        }}
      >
        <DialogContent
          showCloseButton={false}
          aria-busy={busy}
          className={cn(
            "gap-5 rounded-2xl border border-lab-hairline bg-lab-surface-2 p-6 text-lab-ink shadow-2xl ring-0",
            "sm:max-w-md"
          )}
        >
          <div className="grid gap-2">
            <DialogTitle className="text-lg font-medium tracking-tight text-lab-ink">
              {step === "token" ? "知识库口令" : "删除这篇笔记"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-lab-ink-subtle">
              {step === "token"
                ? "口令只留在这台浏览器里。删的时候带给服务器，服务器用 WIKI_ADMIN_TOKEN 核对。"
                : `「${title}」会从站点上删掉，不是只在列表里藏起来。`}
            </DialogDescription>
          </div>

          {step === "token" ? (
            <form onSubmit={saveToken} className="grid gap-4">
              <label className="grid gap-2 text-xs text-lab-ink-subtle">
                口令
                <input
                  type="password"
                  name="wiki-admin-token"
                  autoComplete="current-password"
                  autoFocus
                  value={tokenDraft}
                  onChange={(event) => setTokenDraft(event.target.value)}
                  className={cn(
                    "min-h-11 rounded-xl border border-lab-hairline bg-lab-canvas px-3 text-base text-lab-ink",
                    "caret-lab-primary outline-none",
                    "focus-visible:border-lab-primary/50 focus-visible:ring-2 focus-visible:ring-lab-primary/30"
                  )}
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-lab-error">
                  {error}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={close}
                  className={quietButtonClass}
                >
                  取消
                </button>
                <button type="submit" className={solidButtonClass}>
                  保存
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3">
              {error ? (
                <p role="alert" className="text-sm text-lab-error">
                  {error}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={close}
                  className={quietButtonClass}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmDelete()}
                  className={cn(destructiveButtonClass, busy && "opacity-60")}
                >
                  {busy ? "正在删除" : "确认删除"}
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={replaceToken}
                className={cn(
                  "min-h-11 text-sm text-lab-ink-subtle underline-offset-4 hover:text-lab-ink hover:underline",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
                  "disabled:opacity-50"
                )}
              >
                更换口令
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50";

const quietButtonClass = cn(
  buttonBase,
  "border border-lab-hairline bg-transparent text-lab-ink hover:bg-lab-surface-3 focus-visible:ring-lab-primary/40"
);

const solidButtonClass = cn(
  buttonBase,
  "bg-lab-ink font-medium text-lab-canvas hover:bg-lab-ink/90 focus-visible:ring-lab-primary/40"
);

const destructiveButtonClass = cn(
  buttonBase,
  "border border-lab-hairline-strong bg-transparent font-medium text-lab-error hover:bg-lab-surface-3 focus-visible:ring-lab-error/40"
);
