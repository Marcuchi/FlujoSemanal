
import React from 'react';
import { ExternalLink, Copy, Check, KeyRound } from 'lucide-react';

export const TrackingApp: React.FC = () => {
  const [copiedUser, setCopiedUser] = React.useState(false);
  const [copiedPass, setCopiedPass] = React.useState(false);

  const copyToClipboard = (text: string, isUser: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUser) {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 relative">
      
      {/* Credentials Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-center gap-4 z-20 shadow-md flex-none">
         <div className="flex items-center gap-2 text-slate-400">
            <KeyRound size={16} className="text-indigo-400" />
            <span className="text-xs uppercase font-bold tracking-wider hidden sm:block">Credenciales:</span>
         </div>
         
         <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700 group hover:border-slate-600 transition-colors">
            <span className="text-slate-500 text-xs font-bold uppercase">Usuario:</span>
            <code className="text-emerald-400 font-mono font-bold text-sm">Alpinajulio</code>
            <button onClick={() => copyToClipboard('Alpinajulio', true)} className="ml-1 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Copiar usuario">
               {copiedUser ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
            </button>
         </div>

         <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700 group hover:border-slate-600 transition-colors">
            <span className="text-slate-500 text-xs font-bold uppercase">Pass:</span>
            <code className="text-emerald-400 font-mono font-bold text-sm">210993</code>
            <button onClick={() => copyToClipboard('210993', false)} className="ml-1 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Copiar contraseña">
               {copiedPass ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
            </button>
         </div>

         <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block"></div>

         <a 
            href="https://www.geomov.com/geovp/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
        >
            <ExternalLink size={14} /> <span className="hidden sm:inline">Abrir en Pestaña</span>
        </a>
      </div>

      <div className="flex-1 relative bg-white w-full h-full">
        <iframe 
          src="https://www.geomov.com/geovp/" 
          title="Geomov Tracking"
          className="w-full h-full border-none"
          allow="geolocation; microphone; camera"
          loading="lazy"
        />
      </div>
    </div>
  );
};
