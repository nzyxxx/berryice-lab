import { OceanDive } from "@/components/preview/ocean-dive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "流冰入海",
  robots: { index: false, follow: false },
};

const PRELOAD = [
  "/preview/ocean/surface-2560.avif",
  "/preview/ocean/waterline-2560.avif",
  "/preview/ocean/under-2560.avif",
];

export default function OceanPreviewPage() {
  return (
    <>
      {PRELOAD.map((href) => (
        <link key={href} rel="preload" as="image" href={href} type="image/avif" />
      ))}
      <OceanDive />
    </>
  );
}
