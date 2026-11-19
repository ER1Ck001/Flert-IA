import { DEMO_TONES } from "./demo-data";
import { Section } from "./Section";

export function TonesShowcase() {
  return (
    <Section
      id="tons"
      eyebrow="7 tons"
      title="Um tom para cada momento"
      description="Você escolhe como quer soar. As 3 sugestões seguem o tom escolhido."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_TONES.map(({ value, label, icon: Icon, description }) => (
          <li key={value} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-pink-500/15 text-pink-400">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text">{label}</h3>
              <p className="mt-1 text-sm text-text-2">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
