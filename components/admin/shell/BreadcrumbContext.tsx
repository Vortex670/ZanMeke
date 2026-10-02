"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * BreadcrumbContext — dinamični label override za `AdminBreadcrumbs`.
 *
 * Problem: breadcrumbs so client komponenta in iz pathname-a
 * (`/admin/apartments/apartman-1/pricing`) ne vedo, da je `apartman-1`
 * "Apartma 1". Rešitev: server stran renderira renderless
 * `<BreadcrumbLabel segment="apartman-1" label="Apartma 1" />`, ki
 * registrira override v contextu; breadcrumbs ga preberejo.
 *
 * Provider živi v `(private)/admin/layout.tsx` (ovije topbar + children).
 * Ref-count na segment: isti slug lahko registrira več strani hkrati.
 */

type Overrides = Record<string, string>;

type ContextValue = {
  overrides: Overrides;
  register: (segment: string, label: string) => () => void;
};

const BreadcrumbCtx = createContext<ContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const refCountRef = useRef<Record<string, number>>({});

  const register = useCallback((segment: string, label: string) => {
    refCountRef.current[segment] = (refCountRef.current[segment] ?? 0) + 1;
    setOverrides((prev) =>
      prev[segment] === label ? prev : { ...prev, [segment]: label },
    );
    return () => {
      const count = (refCountRef.current[segment] ?? 0) - 1;
      refCountRef.current[segment] = count;
      if (count <= 0) {
        delete refCountRef.current[segment];
        setOverrides((prev) => {
          if (!(segment in prev)) return prev;
          const next = { ...prev };
          delete next[segment];
          return next;
        });
      }
    };
  }, []);

  const value = useMemo<ContextValue>(
    () => ({ overrides, register }),
    [overrides, register],
  );

  return <BreadcrumbCtx.Provider value={value}>{children}</BreadcrumbCtx.Provider>;
}

export function useBreadcrumbOverrides(): Overrides {
  const ctx = useContext(BreadcrumbCtx);
  return ctx?.overrides ?? {};
}

/**
 * Renderless client komponenta — server stran jo renderira kot child, da
 * breadcrumbs pokažejo pravi naslov namesto URL slug-a.
 *
 * Deps so SAMO [register, segment, label] — `register` je stabilen
 * (useCallback []), sicer bi effect cleanup → setOverrides → nov ctx →
 * re-run ustvaril neskončno zanko.
 */
export function BreadcrumbLabel({
  segment,
  label,
}: {
  segment: string;
  label: string;
}) {
  const ctx = useContext(BreadcrumbCtx);
  const register = ctx?.register;
  useEffect(() => {
    if (!register) return;
    return register(segment, label);
  }, [register, segment, label]);
  return null;
}
