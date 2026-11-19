import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import type { LegalDoc } from "@/content/legal/config";

const focusRing =
  "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

/** Página de documento legal (Termos/Privacidade): leitura confortável a partir de 360px. */
export function LegalDocument({ doc, published }: { doc: LegalDoc; published: boolean }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Flert IA — página inicial" className={`inline-flex min-h-11 items-center ${focusRing}`}>
            <Logo size={28} />
          </Link>
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-text-2 transition-colors hover:text-text ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-10 focus:outline-none sm:px-6 sm:py-14">
        {!published && (
          <div
            role="note"
            className="mb-8 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <p>
              <strong>Rascunho — não publicado.</strong> Este texto ainda será revisado por advogado e só aparece fora de
              produção. Os campos entre colchetes serão preenchidos antes da publicação.
            </p>
          </div>
        )}

        <h1 className="font-display text-h1 text-text">{doc.title}</h1>
        <div className="mt-4 space-y-3">
          {doc.intro.map((p) => (
            <p key={p} className="text-body text-text-2">
              {p}
            </p>
          ))}
        </div>

        <nav aria-label="Seções" className="mt-8 rounded-lg border border-border bg-surface p-4">
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={`inline-flex min-h-11 items-center px-1 text-text-2 hover:text-text ${focusRing}`}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-6">
              <h2 id={`${s.id}-title`} className="font-display text-h3 text-text">
                {s.title}
              </h2>
              <div className="mt-3 space-y-3 break-words text-body text-text-2">
                {s.body.map((block, i) =>
                  typeof block === "string" ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc space-y-2 pl-5 marker:text-violet-400">
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
