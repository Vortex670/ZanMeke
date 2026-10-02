import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "narrow" | "default" | "wide" | "full";
};

const sizeMap: Record<NonNullable<ContainerProps["size"]>, string> = {
  narrow: "max-w-(--container-narrow)", // 52rem (832px) — proza, obrazci
  default: "max-w-(--container)", // 72rem (1152px) — splošen content
  wide: "max-w-[88rem]", // 1408px — galerije, široki gridi
  // Brez meje: koledar s sedmimi stolpci. Pri 1408 px je dan širok 190 px in
  // ime v njem se lomi; na širokem zaslonu je to prostor, ki stoji prazen.
  full: "max-w-none",
};

/**
 * `Container` — centralni wrapper z responsive padding-om.
 * Pravilo: vsak section, ki ima content (ne full-bleed image), naj
 * ovije Container.
 */
export function Container({ size = "default", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...props}
    />
  );
}
