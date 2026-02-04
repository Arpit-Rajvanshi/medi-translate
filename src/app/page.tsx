'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mic, Send, User, Stethoscope, Search, FileText, Square, Menu, X, Calendar, ArrowRight } from 'lucide-react';

// --- Types ---
type Message = {
  id: string;
  conversation_id: string;
  role: 'doctor' | 'patient';
  original_text: string;
  translated_text: string | null;
  audio_url: string | null;
  created_at: string;
};

type SearchResult = Message & {
  conversations: {
    title: string;
    created_at: string;
  }
};

export default function DoctorPatientApp() {
  // --- State: Core ---
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- State: Recording ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- State: Features ---
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeConversation = async (specificId?: string) => {
    let currentId = specificId || localStorage.getItem('activeConversationId');
    
    // Validate ID
    if (currentId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', currentId)
        .single();
      
      if (error || !data) currentId = null;
    }

    // Create New if missing
    if (!currentId) {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ title: 'New Consultation' }])
        .select()
        .single();
        
      if (data) {
        currentId = data.id;
        localStorage.setItem('activeConversationId', data.id);
      }
    }
    
    if (currentId) {
      setConversationId(currentId);
      fetchMessages(currentId);
    }
  };

  const fetchMessages = async (id: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  };

  // --- Audio Handling ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied. Please enable permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Logic: Message Processing ---
  const handleAudioMessage = async (audioBlob: Blob) => {
    if (!conversationId) return;
    setIsProcessing(true);

    try {
      const fileName = `${conversationId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(fileName);

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('targetLang', targetLang); 

      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      });
      
      const { text, translation } = await response.json();
      await saveMessage(text, translation, publicUrl);

    } catch (error) {
      console.error(error);
      alert('Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextMessage = async () => {
    if (!inputText.trim() || !conversationId) return;
    
    const text = inputText;
    const currentTargetLang = targetLang;
    setInputText(''); 
    setIsProcessing(true);

    try {
      const tempId = 'temp-' + Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        conversation_id: conversationId,
        role: role,
        original_text: text,
        translated_text: "Translating...", 
        audio_url: null,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: currentTargetLang }),
      });

      const { translation } = await response.json();

      const newMessage = {
        conversation_id: conversationId,
        role: role,
        original_text: text,
        translated_text: translation, 
        target_lang: currentTargetLang,
        audio_url: null
      };

      const { data } = await supabase.from('messages').insert([newMessage]).select().single();

      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));
      }
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveMessage = async (original: string, translated: string, audioUrl: string | null) => {
    if (!conversationId) return;
    const newMessage = {
      conversation_id: conversationId,
      role: role,
      original_text: original,
      translated_text: translated,
      audio_url: audioUrl,
      target_lang: targetLang
    };
    const { data } = await supabase.from('messages').insert([newMessage]).select();
    if (data) setMessages(prev => [...prev, data[0] as Message]);
  };

  // --- Logic: Summary ---
  const generateSummary = async () => {
    if (!conversationId) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSummaryText(data.summary);
      setShowSummary(true);
    } catch (error) {
      alert('Summary failed. Try sending a message first.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- Logic: Search ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      // Search in messages and join conversations to get the date/title
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations (
            title,
            created_at
          )
        `)
        .ilike('original_text', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchResults(data as any[]); // Using any cast due to Join type complexity
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const loadSearchResult = (id: string) => {
    initializeConversation(id);
    setShowSearch(false);
    localStorage.setItem('activeConversationId', id);
  };

  // Helper to highlight text
  const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{part}</mark> : 
            part
        )}
      </span>
    );
  };

  // --- Render ---
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-white border-b z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Stethoscope className="w-6 h-6" />
          <span>MediTranslate</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <div className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:w-64
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b md:border-none">
          <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Stethoscope className="w-8 h-8" />
            <span className="hidden md:inline">MediTranslate</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => {
               initializeConversation(); // Reset to current or new
               setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors hover:bg-blue-100"
          >
            <User className="w-5 h-5" />
            Current Session
          </button>
          
          <button 
            className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              setShowSearch(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <Search className="w-5 h-5" />
            Search History
          </button>
          
          <button 
            className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            onClick={() => {
              generateSummary();
              setIsMobileMenuOpen(false);
            }}
            disabled={isSummarizing}
          >
            <FileText className={`w-5 h-5 ${isSummarizing ? 'animate-pulse text-blue-500' : ''}`} />
            <span>{isSummarizing ? "Generating..." : "Generate Summary"}</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:max-w-none pt-16 md:pt-0">
        
        {/* Chat Header */}
        <div className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-white z-10 shadow-sm">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setRole('doctor')}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                role === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Doctor
            </button>
            <button 
              onClick={() => setRole('patient')}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                role === 'patient' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Patient
            </button>
          </div>

          <select 
            value={targetLang} 
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-gray-100 border-none rounded-md px-3 py-1.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Hindi">Hindi</option>
            <option value="French">French</option>
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === role ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                msg.role === 'doctor' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${
                  msg.role === 'doctor' ? 'text-blue-100' : 'text-green-600'
                }`}>
                  {msg.role}
                </div>

                <div className="text-base md:text-lg leading-relaxed mb-2">
                  {msg.original_text}
                </div>
                
                {msg.translated_text && (
                  <div className={`text-sm pt-2 mt-2 border-t ${
                    msg.role === 'doctor' ? 'border-blue-400/30 text-blue-50' : 'border-gray-100 text-gray-500'
                  }`}>
                    {msg.translated_text}
                  </div>
                )}

                {msg.audio_url && (
                  <div className="mt-3 bg-black/10 rounded-lg p-1">
                    <audio controls src={msg.audio_url} className="h-8 w-full" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t safe-area-bottom">
          <div className="flex items-center gap-2 md:gap-3 max-w-4xl mx-auto">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 md:p-4 rounded-full transition-all flex-shrink-0 shadow-sm ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextMessage()}
              placeholder={isRecording ? "Listening..." : "Type a message..."}
              disabled={isProcessing || isRecording}
              className="flex-1 bg-gray-50 border-0 rounded-full px-4 md:px-6 py-3 md:py-3.5 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm md:text-base shadow-inner"
            />

            <button 
              onClick={handleTextMessage}
              disabled={!inputText.trim() || isProcessing}
              className="p-3 md:p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isProcessing && (
            <div className="text-center text-xs text-gray-400 mt-2 font-medium animate-pulse">
              Processing translation...
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search across conversations..." 
                className="flex-1 outline-none text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={() => setShowSearch(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              {isSearching ? (
                <div className="text-center p-8 text-gray-400">Searching...</div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center p-8 text-gray-400">No results found.</div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button 
                      key={result.id}
                      onClick={() => loadSearchResult(result.conversation_id)}
                      className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 border border-transparent transition-all group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          result.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {result.role.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(result.conversations?.created_at || result.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-800 line-clamp-2">
                        <HighlightText text={result.original_text} highlight={searchQuery} />
                      </p>
                      
                      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Go to conversation <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t bg-gray-50 rounded-b-xl">
              <button 
                onClick={handleSearch}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Medical Summary
              </h2>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50">
              <div className="prose prose-blue max-w-none">
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 bg-white p-6 rounded-lg border shadow-sm">
                  {summaryText}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-2">
              <button onClick={() => setShowSummary(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">Print Report</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}