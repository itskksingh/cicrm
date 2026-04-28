import Link from "next/link";
import { ArrowRight, Shield, Zap, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="bg-blob top-[-10%] left-[-10%]"></div>
      <div className="bg-blob bottom-[-10%] right-[-10%] opacity-60"></div>
      
      {/* Header */}
      <header className="w-full px-6 py-8 flex items-center justify-between z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-fixed rounded-xl shadow-sm">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-primary">Crest Care</span>
        </div>
        <Link 
          href="/auth" 
          className="text-sm font-bold uppercase tracking-wider text-primary hover:text-primary-container transition-colors"
        >
          Staff Portal
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 w-full max-w-5xl mx-auto text-center mt-8 lg:mt-[-4rem]">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8">
          <Zap className="w-4 h-4 text-primary fill-primary/20" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">AI-Powered Conversion</span>
        </div>

        <h1 className="heading-main mb-6">
          Clinical Concierge System
        </h1>
        
        <p className="text-body mx-auto mb-10 max-w-2xl">
          The next-generation hospital CRM designed exclusively for Crest Care. 
          Manage WhatsApp leads automatically, prioritize urgent patients, and enable instant calling and conversion.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/auth"
            className="w-full sm:w-auto login-gradient text-on-primary py-4 px-8 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Access Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#" 
            className="w-full sm:w-auto py-4 px-8 rounded-xl font-bold text-sm tracking-wide bg-white text-on-surface border border-outline-variant/30 hover:border-primary/50 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            View Documentation
          </a>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
             <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
               <Activity className="w-5 h-5 text-hot" />
             </div>
             <h3 className="font-bold text-on-surface mb-2">Smart Triage</h3>
             <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Automatically detects urgent symptoms and prioritizes hot leads to the top of the queue.</p>
          </div>
          
          <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
               <Zap className="w-5 h-5 text-cold" />
             </div>
             <h3 className="font-bold text-on-surface mb-2">Automated Webhooks</h3>
             <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Direct integration with Facebook Ads and WhatsApp for zero-latency lead capture.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-6 ambient-shadow">
             <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
               <Shield className="w-5 h-5 text-warm" />
             </div>
             <h3 className="font-bold text-on-surface mb-2">Secure Access</h3>
             <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Role-based authentication ensures patient data is only accessible to authorized medical staff.</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-8 text-center z-10 mt-12">
        <p className="text-xs text-on-surface-variant font-medium">
          &copy; {new Date().getFullYear()} Crest Care Hospital. HIPAA Compliant CRM System.
        </p>
      </footer>
    </div>
  );
}
