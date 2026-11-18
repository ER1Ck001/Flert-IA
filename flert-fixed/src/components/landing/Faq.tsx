import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/content/faq";
import { Section } from "./Section";

export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Dúvidas frequentes">
      <div className="max-w-3xl space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="group rounded-lg border border-border bg-surface">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-body font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-text-2 transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-5 text-sm text-text-2">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
