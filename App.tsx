import React, { useState, useEffect } from 'react';
import AgentSidebar from './components/AgentSidebar';
import ChatArea from './components/ChatArea';
import { AgentId, Message, AppState } from './types';
import { INITIAL_GREETING, AGENTS } from './constants';
import { routeQuery, generateAgentResponse } from './services/geminiService';

const App: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentId>(AgentId.NAVIGATOR);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);

  // Auto-scroll logic is handled in ChatArea, but we ensure state flows correctly here

  const handleResetSession = () => {
    setActiveAgent(AgentId.NAVIGATOR);
    
    // Optional: Add a system message indicating return to main menu
    const resetMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      text: "Sesi dengan unit sebelumnya telah diakhiri. Anda kembali ke Navigator Utama. Ada yang lain yang bisa saya bantu?",
      agentId: AgentId.NAVIGATOR,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, resetMsg]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || appState !== AppState.IDLE) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let targetAgent = activeAgent;
      let contextForAgent = userText;

      // 2. Routing Logic (Only if currently at Navigator)
      if (activeAgent === AgentId.NAVIGATOR) {
        setAppState(AppState.ROUTING);
        
        // Short delay for UI effect
        await new Promise(r => setTimeout(r, 600)); 
        
        const routeResult = await routeQuery(userText);
        
        console.log("Router decided:", routeResult);
        targetAgent = routeResult.target;
        contextForAgent = routeResult.context; // Refined context from the router
        
        setActiveAgent(targetAgent);
      }

      // 3. Generate Response from Sub-Agent
      setAppState(AppState.GENERATING);
      
      const response = await generateAgentResponse(targetAgent, messages, contextForAgent);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        agentId: targetAgent,
        timestamp: Date.now(),
        sources: response.sources
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("App Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "Mohon maaf, terjadi kesalahan pada sistem. Silakan coba lagi.",
        agentId: AgentId.NAVIGATOR,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <AgentSidebar 
        activeAgentId={activeAgent} 
        onResetSession={handleResetSession}
      />
      
      {/* Main Content */}
      <ChatArea 
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={handleSend}
        appState={appState}
        activeAgentId={activeAgent}
      />
    </div>
  );
};

export default App;