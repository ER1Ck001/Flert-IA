import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Section } from "@/components/landing/Section";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { TonesShowcase } from "@/components/landing/TonesShowcase";
import { PlansSection } from "@/components/landing/PlansSection";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Flert IA — 3 sugestões de resposta em 7 tons",
  description:
    "Envie o print da conversa ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia.",
};

export default function Home() {
  return (
    <>
      <LandingHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <HowItWorks />
        <Section
          id="demo"
          eyebrow="Experimente"
          title="Veja como as sugestões mudam com o tom"
          description="Escolha um cenário e um tom para ver 3 sugestões de exemplo."
        >
          <InteractiveDemo />
        </Section>
        <TonesShowcase />
        <PlansSection />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
