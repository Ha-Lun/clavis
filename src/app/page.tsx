import { getUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Target } from "lucide-react";

export default async function RootPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground font-sans selection:bg-[#c9a84c]/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#c9a84c]/20 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#c9a84c]">
            <svg viewBox="0 0 24 24" fill="none" className="size-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
              <circle cx="12" cy="6" r="4" />
              <circle cx="12" cy="6" r="1.5" />
              <path d="M12 10v11" />
              <path d="M12 17h4v4h-2v-2h-2" />
            </svg>
            <span className="font-serif text-xl tracking-widest uppercase font-bold" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Clavis</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="text-muted-foreground hover:text-[#c9a84c] transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="bg-[#c9a84c] text-[#0a0a0f] px-4 py-2 rounded hover:bg-[#c9a84c]/90 transition-colors font-semibold">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative px-4 pt-32 pb-24 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(201,168,76,0.1),transparent)] pointer-events-none" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            The Socratic AI Teaching Assistant for <span className="text-[#c9a84c]">Higher Education</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl font-serif" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            Academic rigor without fluff. Step-by-step Socratic inquiry, deep Canvas/Studium LMS course memory, and lecture slide comprehension.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[#c9a84c] text-[#0a0a0f] px-6 py-3 rounded text-base font-semibold hover:bg-[#c9a84c]/90 transition-colors">
              Enter Clavis <ArrowRight className="size-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-transparent border border-[#c9a84c]/30 text-foreground px-6 py-3 rounded text-base font-medium hover:bg-[#c9a84c]/10 transition-colors">
              Explore Courses
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24 border-t border-[#c9a84c]/20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-[#c9a84c]/20 bg-white/[0.02] backdrop-blur-sm">
              <div className="size-12 rounded bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] mb-6">
                <BrainCircuit className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Socratic Inquiry</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Never gives answers without teaching. Clavis pushes deeper comprehension through targeted follow-up questions, fostering true understanding over memorization.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-[#c9a84c]/20 bg-white/[0.02] backdrop-blur-sm">
              <div className="size-12 rounded bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] mb-6">
                <BookOpen className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Canvas LMS Memory</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Indexes syllabi, assignments, announcements, and lecture slides directly into your course workspace for perfectly contextualized assistance.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#c9a84c]/20 bg-white/[0.02] backdrop-blur-sm">
              <div className="size-12 rounded bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] mb-6">
                <Target className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Distraction-Free Focus</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Designed with a Dark Luxury aesthetic—gold accents, obsidian surfaces, and disciplined typography—to foster intense academic focus.
              </p>
            </div>
          </div>
        </section>

        {/* Dialogue Section */}
        <section className="container mx-auto px-4 py-24 border-t border-[#c9a84c]/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
              The Socratic Method in Action
            </h2>
            <div className="space-y-6">
              <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-lg p-4 ml-12">
                <p className="text-sm">Can you just give me the formula for the time complexity of this algorithm?</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mr-12">
                <p className="text-sm font-serif italic text-muted-foreground mb-2">Clavis</p>
                <p className="text-sm leading-relaxed">
                  Let us deduce it together. Looking at the nested loops in your code, how many times does the inner loop execute relative to the outer loop&apos;s variable <code className="text-[#c9a84c]">n</code>?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-24 border-t border-[#c9a84c]/20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What makes Clavis different from generic chatbots?",
                  a: "Clavis is strictly instructed to act as a Socratic tutor. It won't write your essays or solve your math problems outright. Instead, it guides you to the solution through careful questioning."
                },
                {
                  q: "How does Canvas LMS integration work?",
                  a: "By connecting your account, Clavis securely imports your course materials, ensuring it understands the specific context, terminology, and requirements of your syllabus."
                },
                {
                  q: "Is my course data private?",
                  a: "Yes. Your course data is siloed to your workspace. We do not use your private materials or conversations to train our foundational models."
                },
                {
                  q: "What AI models power Clavis?",
                  a: "Clavis utilizes state-of-the-art models fine-tuned for academic reasoning and step-by-step pedagogical instruction."
                }
              ].map((faq, i) => (
                <div key={i} className="border border-[#c9a84c]/20 rounded-lg p-6 bg-white/[0.01]">
                  <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#c9a84c]/20 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
              <circle cx="12" cy="6" r="4" />
              <circle cx="12" cy="6" r="1.5" />
              <path d="M12 10v11" />
              <path d="M12 17h4v4h-2v-2h-2" />
            </svg>
            <span className="text-sm">© {new Date().getFullYear()} Clavis. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-[#c9a84c]">Login</Link>
            <Link href="/signup" className="hover:text-[#c9a84c]">Sign Up</Link>
            <Link href="#" className="hover:text-[#c9a84c]">Terms</Link>
            <Link href="#" className="hover:text-[#c9a84c]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
