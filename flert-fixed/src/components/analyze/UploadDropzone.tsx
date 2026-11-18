"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadDropzoneProps {
  /** Data URL da imagem já carregada (ou null). */
  image: string | null;
  dragOver: boolean;
  onDragOverChange: (over: boolean) => void;
  /** Recebe o arquivo escolhido/solto; a validação fica com quem chama (loadImage). */
  onFile: (file: File) => void;
  onRemove: () => void;
  className?: string;
}

/** Área de envio do print: <label> + input file sr-only (acessível por teclado), arrastar/soltar e preview. */
export function UploadDropzone({ image, dragOver, onDragOverChange, onFile, onRemove, className }: UploadDropzoneProps) {
  const inputId = React.useId();
  const hintId = `${inputId}-hint`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const removedRef = React.useRef(false);

  // Depois de "Remover imagem" o botão some: o foco volta para o seletor de arquivo.
  React.useEffect(() => {
    if (!image && removedRef.current) {
      removedRef.current = false;
      inputRef.current?.focus();
    }
  }, [image]);

  return (
    <div
      className={cn(
        "relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors duration-200 sm:min-h-[280px]",
        dragOver ? "border-violet-400 bg-violet-500/10" : image ? "border-border bg-surface" : "border-border bg-surface/60",
        className
      )}
      onDrop={(e) => {
        e.preventDefault();
        onDragOverChange(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverChange(true);
      }}
      onDragLeave={() => onDragOverChange(false)}
    >
      {image ? (
        <>
          <div className="relative h-[240px] w-full sm:h-[280px]">
            <Image src={image} alt="Print enviado" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-contain p-2" />
          </div>
          <button
            type="button"
            onClick={() => { removedRef.current = true; onRemove(); }}
            aria-label="Remover imagem"
            className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg/80 text-text-2 transition-colors hover:border-danger/50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-full min-h-[inherit] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[inherit] px-6 py-10 text-center focus-within:ring-2 focus-within:ring-violet-400 focus-within:ring-offset-2 focus-within:ring-offset-bg"
        >
          <span
            aria-hidden
            className={cn(
              "mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-violet-400 transition-transform duration-200 motion-reduce:transition-none",
              dragOver && "-translate-y-1 scale-110"
            )}
          >
            <ImageUp className="h-6 w-6" />
          </span>
          <span className="text-body font-semibold text-text">{dragOver ? "Solte aqui" : "Arraste o print aqui"}</span>
          <span id={hintId} className="text-sm text-text-2">
            ou <span className="font-medium text-violet-400 underline-offset-4">toque para selecionar</span> · PNG, JPG até 10 MB
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            aria-describedby={hintId}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
