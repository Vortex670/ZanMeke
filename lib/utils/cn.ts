import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Zlivanje razredov — zadnji zmaga, brez podvojenih Tailwind utility-jev. */
export function cn(...vhod: ClassValue[]): string {
  return twMerge(clsx(vhod));
}
