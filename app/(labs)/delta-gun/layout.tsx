import { DeltaGunChrome } from "@/components/lab/delta-gun-chrome";
import type { ReactNode } from "react";

export default function DeltaGunLayout({ children }: { children: ReactNode }) {
  return <DeltaGunChrome>{children}</DeltaGunChrome>;
}
