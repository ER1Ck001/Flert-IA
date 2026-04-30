"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap, Heart, MessageCircle, Check, Star, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070709]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Heart className="h-7 w-7 text-brand-500 fill-brand-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-brand-500/20 blur-lg rounded-full" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-500 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Flert IA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">
              Funcionalidades
            </Link>
            <Link href="#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">
              Como Funciona
            </Link>
            <Link href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">
              Preços
            </Link>
            <Link href="#testimonials" className="text-sm text-white/50 hover:text-white transition-colors">
              Depoimentos
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-white/70 hover:text-white hover:bg-white/5">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" variant="brand">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 lg:py-40">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-8 animate-fade-in hover:bg-brand-500/15 transition-colors cursor-default">
                <Sparkles className="h-4 w-4" />
                <span>IA de última geração para suas conversas</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-white">
                Transforme suas{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-brand-500 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    conversas
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-brand-500/20 blur-xl" />
                </span>
                <br />
                em conexões reais
              </h1>

              <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                O Flert IA usa inteligência artificial avançada para analisar conversas e criar
                respostas envolventes que geram conexões verdadeiras.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="brand" className="w-full sm:w-auto h-12 px-8 text-base">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white"
                  >
                    Ver como funciona
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  <span><strong className="text-white">10K+</strong> usuários ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-brand-500" />
                  <span><strong className="text-white">1M+</strong> mensagens geradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-500" />
                  <span><strong className="text-white">95%</strong> taxa de sucesso</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4 block">
                Funcionalidades
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Por que escolher o{" "}
                <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
                  Flert IA
                </span>?
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-lg font-light">
                Nossa IA foi treinada com milhares de conversas reais para entender
                nuances, contexto e criar respostas autênticas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              <FeatureCard
                icon={MessageCircle}
                title="Respostas Inteligentes"
                description="Nossa IA entende contexto, tom e intenção para gerar respostas que soam naturais e envolventes."
                gradient="from-brand-500 to-pink-500"
              />
              <FeatureCard
                icon={Zap}
                title="Tempo Real"
                description="Respostas instantâneas para você nunca perder o ritmo da conversa."
                gradient="from-yellow-500 to-orange-500"
              />
              <FeatureCard
                icon={Heart}
                title="Flertes Personalizados"
                description="Sugestões de flertes adaptadas ao seu estilo e personalidade."
                gradient="from-red-500 to-pink-500"
              />
              <FeatureCard
                icon={Shield}
                title="Privacidade Total"
                description="Suas conversas são criptografadas e nunca são compartilhadas."
                gradient="from-green-500 to-emerald-500"
              />
              <FeatureCard
                icon={Users}
                title="Multi-Plataforma"
                description="Funciona com Tinder, Bumble, Instagram, WhatsApp e mais."
                gradient="from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon={Sparkles}
                title="Aprendizado Contínuo"
                description="A IA aprende com seu estilo para ficar cada vez mais precisa."
                gradient="from-purple-500 to-violet-500"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,45,149,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4 block">
                Como Funciona
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Três passos{" "}
                <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
                  simples
                </span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-lg font-light">
                Do upload ao resultado em segundos
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StepCard number="01" title="Faça Upload" description="Envie um print da conversa ou mensagem que você recebeu." />
              <StepCard number="02" title="Escolha o Estilo" description="Selecione o tom: engraçado, flertando, sério ou casual." />
              <StepCard number="03" title="Receba Sugestões" description="Nossa IA gera 3 sugestões de respostas personalizadas para você." />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4 block">
                Preços
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Planos simples e{" "}
                <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
                  transparentes
                </span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto text-lg font-light">
                Escolha o plano ideal e tenha acesso a recursos ilimitados de IA.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <PricingCard
                title="Premium"
                price="R$ 29,90"
                period="/mês"
                description="Para quem leva a sério"
                features={[
                  "Mensagens ilimitadas",
                  "Respostas avançadas",
                  "Análise de perfil",
                  "Suporte prioritário",
                  "Modo personalizado",
                ]}
                cta="Assinar Premium"
                href="/auth/register?plan=premium"
                featured
              />
              <PricingCard
                title="Vitalício"
                price="R$ 297"
                period="único"
                description="Acesso para sempre"
                features={[
                  "Todos os recursos Premium",
                  "Acesso vitalício",
                  "Updates futuros inclusos",
                  "Suporte VIP",
                  "Early access a features",
                ]}
                cta="Comprar Vitalício"
                href="/auth/register?plan=lifetime"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,45,149,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4 block">
                Depoimentos
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                O que nossos{" "}
                <span className="bg-gradient-to-r from-brand-500 to-purple-400 bg-clip-text text-transparent">
                  usuários
                </span>{" "}
                dizem
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              <TestimonialCard
                content="O Flert IA mudou completamente minhas conversas no Tinder. Consegui matches incríveis graças às sugestões!"
                author="Pedro H."
                role="Usuário Premium"
              />
              <TestimonialCard
                content="As respostas são tão naturais que ninguém acredita que é IA. Simplesmente incrível!"
                author="Lucas M."
                role="Usuário Vitalício"
              />
              <TestimonialCard
                content="Melhor investimento que fiz. O plano vitalício se pagou em uma semana."
                author="Rafael S."
                role="Usuário Premium"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden p-8 md:p-16 text-center border border-brand-500/20"
              style={{
                background: "linear-gradient(135deg, rgba(255,45,149,0.15) 0%, rgba(139,92,246,0.15) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Pronto para transformar suas conversas?
                </h2>
                <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto font-light">
                  Junte-se a milhares de usuários que já estão criando conexões reais com o poder da IA.
                </p>
                <Link href="/auth/register">
                  <Button size="lg" variant="brand" className="h-14 px-10 text-lg">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-brand-500 fill-brand-500" />
              <span className="font-semibold text-white">Flert IA</span>
            </div>
            <p className="text-sm text-white/30">
              © 2024 Flert IA. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Termos</Link>
              <Link href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Privacidade</Link>
              <Link href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Contato</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-brand-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 hover:bg-white/[0.04]">
      <div
        className={`h-14 w-14 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-white/50 leading-relaxed font-light">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-500 text-white text-2xl font-bold mb-4 shadow-lg shadow-brand-500/25">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-white/50 font-light">{description}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  description,
  features,
  cta,
  href,
  featured,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-2 ${
        featured
          ? "border-brand-500/40 bg-brand-500/5 shadow-xl shadow-brand-500/20"
          : "border-white/[0.06] bg-white/[0.02] hover:border-brand-500/20 hover:shadow-lg hover:bg-white/[0.04]"
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-white text-sm font-medium flex items-center gap-1.5 shadow-lg">
          <Star className="h-3 w-3 fill-white" />
          Mais Popular
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-white">{price}</span>
          <span className="text-white/40">{period}</span>
        </div>
        <p className="text-sm text-white/40 mt-2">{description}</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-white/60">
            <div className="h-5 w-5 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-brand-500" />
            </div>
            {feature}
          </li>
        ))}
      </ul>
      <Link href={href} className="block">
        <Button className="w-full h-11" variant={featured ? "brand" : "outline"}>
          {cta}
        </Button>
      </Link>
    </div>
  );
}

function TestimonialCard({ content, author, role }: { content: string; author: string; role: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-brand-500/20 transition-all duration-300 hover:bg-white/[0.04]">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-white/50 mb-6 leading-relaxed font-light">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
          {author[0]}
        </div>
        <div>
          <p className="font-semibold text-sm text-white">{author}</p>
          <p className="text-xs text-white/40">{role}</p>
        </div>
      </div>
    </div>
  );
}
