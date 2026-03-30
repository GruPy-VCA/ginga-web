import { useEffect, useId, useRef, useState } from "react";
import {
  fetchPrivateImageUrl,
  uploadImageToS3,
  type UploadPurpose,
} from "../lib/imageUpload";

type Props = {
  purpose: UploadPurpose;
  value: string;
  onChange: (s3Key: string) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  variant?: "profile" | "company";
};

export function ImageUploadField({
  purpose,
  value,
  onChange,
  label,
  hint,
  disabled,
  variant = "profile",
}: Props) {
  const baseId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = value.trim();
    if (!key) {
      setPreviewUrl(null);
      return;
    }
    (async () => {
      try {
        const url = await fetchPrivateImageUrl(key);
        if (!cancelled) setPreviewUrl(url);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    setUploading(true);
    try {
      const key = await uploadImageToS3(purpose, file);
      onChange(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    onChange("");
    setPreviewUrl(null);
    setError(null);
  }

  const frame =
    variant === "company"
      ? "rounded-xl border border-gray-200 bg-gray-50"
      : "rounded-xl border border-primary-200 bg-primary/5";

  const btnPrimary =
    "inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-50 min-h-[44px]";

  const btnGhost =
    variant === "company"
      ? "inline-flex justify-center items-center px-4 py-2 rounded-xl border border-gray-200 text-foreground text-sm font-medium hover:bg-gray-50 min-h-[40px]"
      : "inline-flex justify-center items-center px-4 py-2 rounded-xl border border-primary-200 text-foreground text-sm font-medium hover:bg-primary/5 min-h-[40px]";

  return (
    <div className="space-y-3">
      {label ? (
        <label htmlFor={baseId} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      ) : null}
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={`shrink-0 size-28 overflow-hidden flex items-center justify-center ${frame}`}
          aria-hidden
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-center px-2 text-foreground/50">Sem imagem</span>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <input
            ref={fileRef}
            id={baseId}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={onPickFile}
            disabled={disabled || uploading}
            aria-label={
              label
                ? undefined
                : purpose === "avatar"
                  ? "Enviar foto do perfil"
                  : "Enviar logo da empresa"
            }
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => fileRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? "Enviando…" : value.trim() ? "Alterar imagem" : "Enviar imagem"}
            </button>
            {value.trim() ? (
              <button type="button" className={btnGhost} onClick={clear} disabled={disabled || uploading}>
                Remover
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
