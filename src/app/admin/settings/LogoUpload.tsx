"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 200 * 1024; // 200KB

type Props = {
  defaultValue: string | null;
};

export function LogoUpload({ defaultValue }: Props) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`La imagen pesa ${(file.size / 1024).toFixed(0)}KB, máximo ${MAX_BYTES / 1024}KB.`);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setValue(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => setError("No pudimos leer el archivo.");
    reader.readAsDataURL(file);
  }

  function onClear() {
    setValue("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1 block text-sm">Logo del negocio</p>
      <input type="hidden" name="logoUrl" value={value} />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-zinc-400">sin logo</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={onPick}
            className="text-sm"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="self-start text-xs text-red-600 underline"
            >
              Quitar logo
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-zinc-500">
        Recomendado: cuadrado, hasta {MAX_BYTES / 1024}KB.
      </p>
    </div>
  );
}
