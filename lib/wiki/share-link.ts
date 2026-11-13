export async function writePageLink(
  url: string,
  write: (value: string) => Promise<void>
): Promise<"copied" | "failed"> {
  try {
    await write(url);
    return "copied";
  } catch {
    return "failed";
  }
}
