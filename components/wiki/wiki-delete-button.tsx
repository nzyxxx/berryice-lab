"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

const TOKEN_KEY = "berryice.wiki.adminToken";

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

/**
 * 删除一篇笔记。口令只留在这台浏览器，请求时放进 Authorization。
 * 确认之后才发请求；请求没回来之前锁住，连点不会打出第二下。
 */
export function WikiDeleteButton({
  slug,
  title,
  redirectTo,
  className,
}: {
  slug: string;
  title: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [tokenDraft, setTokenDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("网络中断了，笔记还在");
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
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm text-lab-error",
          "transition-colors hover:bg-lab-error/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-error/40",
          className
        )}
      >
        删除
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
          className={cn(glassSurfaceClass(), "rounded-3xl bg-lab-canvas/92 p-5 text-lab-ink sm:max-w-sm")}
        >
          <DialogTitle className="text-base font-medium tracking-tight text-lab-ink">
            {step === "token" ? "知识库口令" : "删除这篇笔记"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-lab-ink-subtle">
            {step === "token"
              ? "口令只留在这台浏览器里。删的时候带给服务器，服务器用 WIKI_ADMIN_TOKEN 核对。"
              : `「${title}」会从站点上删掉，不是只在列表里藏起来。`}
          </DialogDescription>

          {step === "token" ? (
            <form onSubmit={saveToken} className="grid gap-3">
              <label className="grid gap-2 text-xs text-lab-ink-tertiary">
                口令
                <input
                  type="password"
                  name="wiki-admin-token"
                  autoComplete="current-password"
                  autoFocus
                  value={tokenDraft}
                  onChange={(event) => setTokenDraft(event.target.value)}
                  className="min-h-11 rounded-2xl border border-white/12 bg-lab-surface-1 px-3 text-base text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                />
              </label>
              {error ? <p className="text-sm text-lab-error">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="min-h-11 rounded-full border border-white/12 text-sm text-lab-ink"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-full bg-lab-primary/15 text-sm font-medium text-lab-primary"
                >
                  保存
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3">
              {error ? <p className="text-sm text-lab-error">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={close}
                  className="min-h-11 rounded-full border border-white/12 text-sm text-lab-ink disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmDelete()}
                  className="min-h-11 rounded-full border border-lab-error/40 bg-lab-error/10 text-sm font-medium text-lab-error disabled:opacity-50"
                >
                  {busy ? "删除中…" : "确认删除"}
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={replaceToken}
                className="min-h-11 text-sm text-lab-ink-subtle underline-offset-2 hover:underline disabled:opacity-50"
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
