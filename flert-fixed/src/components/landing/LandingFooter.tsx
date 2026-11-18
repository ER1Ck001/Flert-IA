import { Logo } from "@/components/brand/Logo";
import { SUPPORT_EMAIL } from "@/components/app/nav-items";
import { CookiePrefsButton } from "./CookiePrefsButton";

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-site flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-text-2">© {year} Flert IA. Todos os direitos reservados.</p>
        </div>
        <ul className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <li>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex min-h-11 items-center break-all rounded-sm text-sm text-text-2 underline-offset-4 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Suporte: {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            <CookiePrefsButton />
          </li>
        </ul>
      </div>
    </footer>
  );
}
