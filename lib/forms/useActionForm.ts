"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions/helpers";

/**
 * `useActionForm` — EN tok za vse obrazce (standard §4, korak 3).
 *
 * ```
 * <Form> (client) → useActionForm(action) → lib/<domena>/actions.ts → Zod
 *                                          ← ActionResult
 *   pending na gumbu · napake na poljih (<Field error>) · toast ob uspehu
 *   in napaki (sonner) · reset ali preusmeritev
 * ```
 *
 * Ista implementacija in isti API kot v zanmeke.com — ne spreminjaj enega
 * brez drugega.
 *
 * Uporaba:
 * ```tsx
 * const t = useTranslations("…");
 * const form = useActionForm(saveThing, {
 *   successToast: t("saved"),        // besedilo je že prevedeno (hook ne kliče i18n)
 *   resetOnSuccess: true,
 * });
 *
 * <form onSubmit={form.handleSubmit}>              // FormData vnos
 *   <Field error={form.fieldErrors.email}> … </Field>
 *   <Button type="submit" loading={form.pending}>…</Button>
 * </form>
 *
 * form.submit({ id, notes });                      // objektni vnos
 * ```
 *
 * Toasti: ob uspehu `successToast` (string) ali, če ni podan, `result.message`
 * (če ga strežnik vrne); `false` izklopi. Ob napaki `result.message`, razen
 * če je `errorToast: false`. Sporočila strežnik že prevede (`getTranslations`).
 *
 * `formAction` je za `<form action={form.formAction}>` — React 19 v tem
 * primeru po koncu akcije SAM ponastavi nenadzorovana polja (tudi ob
 * napaki), zato je privzeta pot `onSubmit={form.handleSubmit}`, ki polja
 * ohrani in jih ponastavi samo ob `resetOnSuccess`.
 */

export type FieldErrors = Record<string, string[]>;

export type ActionFailure = Extract<ActionResult<unknown>, { ok: false }>;

export type UseActionFormOptions<TInput, TData> = {
  /** Po uspehu (po toastu, pred resetom/preusmeritvijo). */
  onSuccess?: (data: TData | undefined, input: TInput) => void;
  /** Po neuspehu (po toastu). Npr. za posebne kode ali `stepUpRequired`. */
  onError?: (result: ActionFailure, input: TInput) => void;
  /** Ponastavi `<form>` (prek `handleSubmit`/`formRef`) in stanje ob uspehu. */
  resetOnSuccess?: boolean;
  /** `router.push(redirectTo)` ob uspehu (locale-aware). */
  redirectTo?: string;
  /**
   * Preusmeri s polno navigacijo (`window.location.assign`) namesto
   * `router.push`. Nujno pri prijavi in odjavi: piškotek seje se spremeni,
   * predpomnilnik odjemalčevega usmerjevalnika pa še drži odjavljeno
   * različico ciljne strani — `router.push` zato pristane nazaj na prijavi
   * in šele ročno osveževanje pokaže admin.
   */
  hardRedirect?: boolean;
  /** `router.refresh()` ob uspehu (Next 16 + `[locale]`: revalidatePath ni vedno dovolj). */
  refreshOnSuccess?: boolean;
  /** Že prevedeno besedilo toasta ob uspehu; `false` = brez toasta; `undefined` = `result.message`. */
  successToast?: string | false;
  /** Toast z `result.message` ob napaki (privzeto `true`). */
  errorToast?: boolean;
};

export type UseActionFormReturn<TInput, TData> = {
  /** Pokliči akcijo z objektom ali `FormData`; vrne rezultat (po obdelavi). */
  submit: (input: TInput) => Promise<ActionResult<TData>>;
  /** `<form action={formAction}>` — glej opombo o samodejnem resetu zgoraj. */
  formAction: (formData: FormData) => void;
  /** `<form onSubmit={handleSubmit}>` — preventDefault + FormData (vključno s `submitter`). */
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  /** Ref za `reset()`; `handleSubmit` ga nastavi sam. */
  formRef: React.RefObject<HTMLFormElement | null>;
  pending: boolean;
  /** Napake na poljih zadnjega neuspeha (`{}` sicer). */
  fieldErrors: FieldErrors;
  /** Sporočilo zadnjega NEUSPEHA (za `<Alert>` pod obrazcem); `null` sicer. */
  message: string | null;
  /** Zadnji rezultat (uspeh ali neuspeh), `null` pred prvo oddajo. */
  result: ActionResult<TData> | null;
  /** Počisti rezultat/napake in ponastavi `<form>` (če je znan). */
  reset: () => void;
};

export function useActionForm<TInput, TData = undefined>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseActionFormOptions<TInput, TData> = {},
): UseActionFormReturn<TInput, TData> {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<TData> | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inFlight = useRef(false);

  // Zadnje vrednosti brez ponovnega ustvarjanja `submit` (stabilna referenca).
  //
  // Zapis gre skozi UČINEK in ne med izrisom. Pisanje v `ref.current` sredi
  // izrisa je v Reactu 19 napaka (`react-hooks/refs`): izris se sme
  // ponoviti ali zavreči, in zapis bi se zgodil tudi takrat, ko ta izris
  // nikoli ne pride na zaslon. Oddaja se zgodi po dotiku uporabnika, torej
  // dolgo za tem, ko so učinki že stekli.
  const actionRef = useRef(action);
  const optionsRef = useRef(options);
  useEffect(() => {
    actionRef.current = action;
    optionsRef.current = options;
  });

  const reset = useCallback(() => {
    setResult(null);
    formRef.current?.reset();
  }, []);

  const submit = useCallback(
    (input: TInput) =>
      new Promise<ActionResult<TData>>((resolve) => {
        if (inFlight.current) {
          resolve({ ok: false, message: "" });
          return;
        }
        inFlight.current = true;
        startTransition(async () => {
          const o = optionsRef.current;
          let res: ActionResult<TData>;
          try {
            res = await actionRef.current(input);
          } catch (err) {
            console.error("[useActionForm] action threw:", err);
            res = {
              ok: false,
              message: err instanceof Error ? err.message : "Unexpected error",
            };
          } finally {
            inFlight.current = false;
          }

          setResult(res);

          if (res.ok) {
            if (typeof o.successToast === "string") toast.success(o.successToast);
            else if (o.successToast !== false && res.message) toast.success(res.message);
            o.onSuccess?.(res.data, input);
            if (o.resetOnSuccess) formRef.current?.reset();
            if (o.refreshOnSuccess) router.refresh();
            if (o.redirectTo) {
              if (o.hardRedirect) {
                // Brez jezikovne predpone: zanmeke.com je enojezičen, zato je
                // pot že končna. (Na gostilnici gre tu skozi `getPathname`.)
                window.location.assign(o.redirectTo);
              } else {
                router.push(o.redirectTo);
              }
            }
          } else {
            if (o.errorToast !== false && res.message) toast.error(res.message);
            o.onError?.(res, input);
          }
          resolve(res);
        });
      }),
    [router],
  );

  const formAction = useCallback(
    (formData: FormData) => {
      void submit(formData as unknown as TInput);
    },
    [submit],
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      formRef.current = form;
      const submitter = (e.nativeEvent as SubmitEvent).submitter;
      void submit(new FormData(form, submitter) as unknown as TInput);
    },
    [submit],
  );

  const fieldErrors: FieldErrors =
    result && !result.ok && result.fieldErrors ? result.fieldErrors : {};
  const message = result && !result.ok ? result.message : null;

  return {
    submit,
    formAction,
    handleSubmit,
    formRef,
    pending,
    fieldErrors,
    message,
    result,
    reset,
  };
}
