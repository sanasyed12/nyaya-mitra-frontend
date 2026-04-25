import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
// 👇 CRITICAL: These imports make the Google Login work
import { auth, provider } from './firebase'; 
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [language, setLanguage] = useState('English');
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const textareaRef = useRef(null);

  // Listen for Google Logins on page load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch history only if user is logged in
  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('https://nyaya-mitr-backend.onrender.com/api/history');
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  // Firebase Login & Logout Handlers
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAgentResult(null);
    setHistory([]);
  };

  const handleInput = (e) => {
    setUserInput(e.target.value);
    // Auto-resize magic
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const resetTextareaSize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const startNewChat = () => {
    setAgentResult(null);
    setUserInput('');
    setError('');
    resetTextareaSize();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!userInput) return;

    setIsLoading(true);
    setError('');
    setAgentResult(null);
    
    try {
      const response = await axios.post('https://nyaya-mitr-backend.onrender.com/api/generate-notice', {
        userInput: userInput,
        language: language
      });
      setAgentResult(response.data);
      setUserInput(''); 
      resetTextareaSize();
      fetchHistory(); 
    } catch (err) {
      setError("Connection failed. Please verify the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPastCase = (pastCase) => {
    setAgentResult(pastCase);
    setUserInput(pastCase.problemStatement || ''); 
    setError('');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 0);
  };

  const downloadPDF = () => {
    if (!agentResult) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(agentResult.title, 10, 20);
    doc.setFontSize(10);
    const cleanText = agentResult.documentText.replace(/\\n/g, '\n');
    
    const splitText = doc.splitTextToSize(cleanText, 180);
    doc.text(splitText, 10, 30);
    doc.save(`${agentResult.title.replace(/\s+/g, '_')}_Notice.pdf`);
  };

  // ==========================================
  // VIEW 1: AUTH LOADING STATE
  // ==========================================
  if (isAuthLoading) {
    return <div className="h-screen w-full bg-[#212121] flex items-center justify-center"></div>;
  }

  // ==========================================
  // VIEW 2: LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="h-screen w-full bg-[#212121] flex flex-col items-center justify-center text-gray-200 font-sans selection:bg-gray-700">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-white tracking-tight flex items-center justify-center gap-3 mb-2">
            <span className="text-white">⚖️ Nyaya</span>-Mitra
          </h1>
          <p className="text-gray-400">Log in to your autonomous legal engine</p>
        </div>
        
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: MAIN APP (If Logged In)
  // ==========================================
  return (
  <div className="h-screen w-full bg-[#212121] text-gray-200 flex flex-col overflow-hidden font-sans selection:bg-gray-700">
      
      {/* Header - Minimalist */}
      <header className="py-3 border-b border-white/10 shrink-0 flex justify-between items-center bg-[#171717] z-10 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium text-white tracking-wide flex items-center gap-2">
            Nyaya-Mitra
          </h1>
        </div>
        
        {/* Right Header Area: Language & Profile */}
        <div className="flex items-center gap-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#2f2f2f] text-gray-200 text-xs py-1.5 px-3 rounded border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer transition-colors hover:bg-[#3a3a3a]"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Telugu">తెలుగు (Telugu)</option>
            <option value="Urdu">اردو (Urdu)</option>
          </select>
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
  <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full border border-white/20 object-cover shadow-sm" />
            <button 
              onClick={handleLogout} 
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex flex-row w-full overflow-hidden">
        
        {/* SIDEBAR: Chatgpt Style */}
        <aside className="w-64 bg-[#171717] flex flex-col hidden md:flex shrink-0 border-r border-white/10">
          
          <div className="p-3 shrink-0">
            <button 
              onClick={startNewChat}
              className="w-full flex items-center justify-start gap-2 bg-transparent hover:bg-[#2f2f2f] text-white text-sm py-2.5 px-3 rounded-lg transition-colors border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 custom-scrollbar">
            <div className="text-xs font-semibold text-gray-500 mb-3 px-2 mt-2">Past Consultations</div>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500 px-2">No previous chats.</p>
            ) : (
              history.map((item) => (
                <button 
                  key={item._id}
                  onClick={() => loadPastCase(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${
                    agentResult && agentResult._id === item._id 
                    ? 'bg-[#2f2f2f] text-white' 
                    : 'text-gray-400 hover:bg-[#212121] hover:text-gray-200'
                  }`}
                >
                  <span className="block truncate">{item.title}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden bg-[#212121] items-center">
            
            <div className="w-full max-w-4xl flex flex-col gap-6 h-full">
                
                {/* OUTPUT AREA (Top) */}
                <section className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-[#171717] p-6 shadow-sm">
                    {!agentResult && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-12 h-12 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                        <p className="text-sm font-medium text-center">Hello, {user.displayName.split(' ')[0]}.<br/>How can I help you with your legal issue today?</p>
                    </div>
                    )}

                    {isLoading && (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">Analyzing legal framework...</p>
                        </div>
                    </div>
                    )}

                    {agentResult && !isLoading && (
                    <div className="space-y-6 animate-fade-in flex flex-col h-full">
                        
                        {/* Original Complaint */}
                        {agentResult.problemStatement && (
                        <div className="flex items-start gap-4 mb-2">
                     <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full shrink-0 border border-white/10 object-cover shadow-sm" />
                            <div className="pt-1 text-gray-200 text-sm leading-relaxed">
                                {agentResult.problemStatement}
                            </div>
                        </div>
                        )}

                        <div className="border-t border-white/10 my-4"></div>

                        {/* AI Response Block */}
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-sm bg-white text-black flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                            </div>
                            
                            <div className="flex-1 space-y-5 pt-1">
                                <div>
                                    <h2 className="text-lg font-medium text-white mb-2">{agentResult.title}</h2>
                                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-[#2f2f2f] text-gray-300 border border-white/5">
                                        {agentResult.framework}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Mapped Rights</h3>
                                    <ul className="space-y-2">
                                        {agentResult.rights.map((right, index) => (
                                        <li key={index} className="flex items-start text-sm text-gray-300 leading-relaxed">
                                            <span className="mr-2 mt-0.5 text-gray-500">-</span>
                                            {right}
                                        </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-sm font-semibold text-gray-400">Drafted Notice</h3>
                                        <button 
                                            onClick={downloadPDF}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            Export PDF
                                        </button>
                                    </div>
                                    <div className="bg-[#000000] p-5 rounded-lg border border-white/10 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed max-h-[400px]">
                                        {agentResult.documentText.replace(/\\n/g, '\n')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </section>

                {/* INPUT AREA (Bottom) */}
                <section className="shrink-0 w-full">
                    <form onSubmit={handleGenerate} className="relative flex items-center">
                        <textarea 
                            ref={textareaRef}
                            rows={1}
                            className="w-full py-4 pl-4 pr-14 bg-[#2f2f2f] border border-white/10 text-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-gray-500 text-sm shadow-lg min-h-[56px] overflow-y-auto custom-scrollbar"
                            placeholder="Message Nyaya-Mitra... (Shift + Enter for new line)"
                            value={userInput}
                            onChange={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate(e);
                                }
                            }}
                        ></textarea>
                        
                        <button 
                            type="submit" 
                            disabled={isLoading || !userInput}
                            className="absolute right-2 p-2 bg-white text-black rounded-lg hover:bg-gray-200 disabled:bg-[#2f2f2f] disabled:text-gray-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7"></path></svg>
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-500 mt-2">
                        Nyaya-Mitra can make mistakes. Consider verifying critical legal information.
                    </p>
                    {error && <p className="text-red-400 mt-2 text-xs text-center">{error}</p>}
                </section>

            </div>
        </div>
      </main>
    </div>
  );
}

export default App;