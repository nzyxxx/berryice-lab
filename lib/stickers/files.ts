export function blobToDataUrl(blob: Blob, timeoutMs = 8_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timer = setTimeout(() => {
      reader.abort();
      reject(new Error("读文件超时"));
    }, timeoutMs);
    reader.onload = () => {
      clearTimeout(timer);
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("读文件失败"));
    };
    reader.onerror = () => {
      clearTimeout(timer);
      reject(new Error("读文件失败"));
    };
    reader.readAsDataURL(blob);
  });
}

function safeFileName(title: string): string {
  const cleaned = title.replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 40) || "sticker";
}

/** 站内路径和 data: URL 都是同源，`download` 属性直接生效，不用先 fetch。 */
export function downloadSticker(src: string, title: string) {
  const anchor = document.createElement("a");
  anchor.href = src;
  anchor.download = `${safeFileName(title)}-微信版.gif`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
