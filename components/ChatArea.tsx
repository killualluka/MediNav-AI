import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, AgentId, AppState } from '../types';
import { AGENTS } from '../constants';
import { Send, Bot, User, Loader2, ExternalLink, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSend: () => void;
  appState: AppState;
  activeAgentId: AgentId;
}

// Quick suggestions based on active agent
const SUGGESTIONS: Record<AgentId, string[]> = {
  [AgentId.NAVIGATOR]: [
    "Saya ingin daftar pasien baru",
    "Cek jadwal dokter gigi",
    "Info BPJS dan asuransi",
    "Lihat hasil lab saya"
  ],
  [AgentId.PIA]: [
    "Daftar pasien baru",
    "Update alamat rumah",
    "Jam besuk hari ini",
    "Lokasi parkir"
  ],
  [AgentId.AS]: [
    "Jadwal Dokter Penyakit Dalam",
    "Booking untuk besok pagi",
    "Batalkan janji temu",
    "Dokter Anak yang tersedia"
  ],
  [AgentId.MRA]: [
    "Hasil lab darah terakhir",
    "Riwayat resep obat",
    "Download resume medis",
    "Diagnosa kunjungan kemarin"
  ],
  [AgentId.BIA]: [
    "Cek total tagihan",
    "Apakah menerima BPJS?",
    "Cara pembayaran cicilan",
    "Rincian biaya obat"
  ]
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  inputValue, 
  setInputValue, 
  onSend, 
  appState,
  activeAgentId 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  useEffect(() => {
    if (appState === AppState.IDLE) {
      inputRef.current?.focus();
    }
  }, [appState]);

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    // Optional: Auto send immediately
    // onSend(); 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const activeAgentConfig = AGENTS[activeAgentId];
  const currentSuggestions = SUGGESTIONS[activeAgentId] || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative font-sans">
      {/* Header Mobile Only */}
      <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-20 shadow-sm">
        <span className="font-bold text-slate-800 flex items-center gap-2">
           <Sparkles size={18} className="text-teal-500"/> MediNav
        </span>
        <span className="text-[10px] font-medium px-2 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full">
          {activeAgentConfig.name}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const agent = msg.agentId ? AGENTS[msg.agentId] : AGENTS[AgentId.NAVIGATOR];
          
          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 ${
                  isUser 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' 
                    : (agent.color || 'bg-slate-600') + ' text-white'
                }`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && (
                    <span className="text-[11px] font-medium text-slate-400 mb-1 ml-1 tracking-wide">
                      {agent.name}
                    </span>
                  )}
                  
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed markdown-body ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {/* Markdown Renderer to remove *...* and format text */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Sources / Grounding */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-2 ml-1">
                        {msg.sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 text-teal-600 px-2 py-1 rounded-full hover:bg-teal-50 transition-colors shadow-sm"
                          >
                            <ExternalLink size={10} />
                            {source.title}
                          </a>
                        ))}
                     </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Thinking States */}
        {appState === AppState.ROUTING && (
          <div className="flex justify-center items-center py-4">
             <div className="bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 rounded-full shadow-sm flex items-center gap-3 text-xs font-medium text-slate-500">
                <Loader2 size={14} className="animate-spin text-teal-500" />
                <span>Menghubungkan ke unit terkait...</span>
             </div>
          </div>
        )}

        {appState === AppState.GENERATING && (
           <div className="flex w-full justify-start pl-2">
            <div className="flex max-w-[85%] gap-3 flex-row">
               <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activeAgentConfig.color} text-white mt-1 shadow-sm`}>
                  <Bot size={16} />
               </div>
               <div className="flex flex-col items-start">
                  <span className="text-[11px] text-slate-400 mb-1 ml-1">{activeAgentConfig.name}</span>
                  <div className="bg-white text-slate-700 border border-slate-100 rounded-tl-none rounded-2xl p-4 shadow-sm">
                    <div className="flex space-x-1.5 h-4 items-center">
                      <div className="w-2 h-2 bg-slate-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
               </div>
            </div>
           </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area & Quick Suggestions */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        
        {/* Quick Actions (Chips) */}
        {appState === AppState.IDLE && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide mask-linear-fade">
             {currentSuggestions.map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(sugg)}
                  className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-slate-600 hover:text-teal-700 text-xs rounded-lg transition-all duration-200 active:scale-95"
                >
                  {sugg}
                </button>
             ))}
          </div>
        )}

        <div className="p-4 md:p-6 max-w-4xl mx-auto relative flex items-end gap-2">
          <textarea
            ref={inputRef as any}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={appState !== AppState.IDLE}
            rows={1}
            placeholder={
                appState !== AppState.IDLE 
                ? "Sedang memproses..." 
                : "Ketik pesan Anda di sini..."
            }
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden min-h-[48px] max-h-[120px]"
            style={{ height: 'auto', minHeight: '48px' }}
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || appState !== AppState.IDLE}
            className="mb-1 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {appState !== AppState.IDLE ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-300 pb-2">
          MediNav AI • Simulasi Sistem Rumah Sakit
        </p>
      </div>
    </div>
  );
};

export default ChatArea;