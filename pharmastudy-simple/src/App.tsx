import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Moon, Sun, Home, BookOpen, FlaskConical, Menu, X, LogOut, Eye, EyeOff, Sparkles, Download, Brain, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from './supabase';

// ==================== DATABASE CONNECTED ====================

// Types
interface User {
  id: string;
  email: string;
  name?: string;
}

interface Molecule {
  id: string;
  name: string;
  smiles: string;
  formula: string;
  description: string;
  imageUrl?: string;
  cas?: string;
  molecularWeight?: string;
}

interface Topic {
  id: string;
  name: string;
  molecules: Molecule[];
}

interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Main App
export default function PharmaStudy() {
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chapters' | 'search' | 'quiz'>('dashboard');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ chapter: Chapter; topic: Topic | null } | null>(null);
  const [editingMolecule, setEditingMolecule] = useState<{ chapter: Chapter; topic: Topic; molecule: Molecule | null } | null>(null);
  
  // New Phase 2 states
  const [pubchemSearchQuery, setPubchemSearchQuery] = useState('');
  const [pubchemResults, setPubchemResults] = useState<any[]>([]);
  const [isSearchingPubchem, setIsSearchingPubchem] = useState(false);
  const [showPubchemModal, setShowPubchemModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizActive, setQuizActive] = useState(false);

  // Load user session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setUser(data.session.user as User);
      loadChapters();
    }
    
    const savedDarkMode = localStorage.getItem('pharmaDarkMode');
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
  };

  const loadChapters = async () => {
    const { data } = await supabase.from('chapters').select('*');
    if (data && data.length > 0) {
      setChapters(data);
    } else {
      // Sample data
      const sampleData: Chapter[] = [
        {
          id: '1',
          name: 'Antibiotics',
          topics: [
            {
              id: '1-1',
              name: 'Beta-Lactams',
              molecules: [
                {
                  id: '1-1-1',
                  name: 'Penicillin G',
                  smiles: 'CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O',
                  formula: 'C₁₆H₁₈N₂O₄S',
                  description: 'First widely used antibiotic. Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins.'
                }
              ]
            }
          ]
        }
      ];
      setChapters(sampleData);
      await supabase.from('chapters').insert(sampleData);
    }
  };

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
     if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });
  
  if (error) throw error;
  
  if (data.user) {
    setUser({ 
      id: data.user.id, 
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email
    });
    await loadChapters();
  }
} else {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        full_name: name
      }
    }
  });
  
  if (error) throw error;
  
  if (data.user) {
    setUser({ 
      id: data.user.id, 
      email: data.user.email || '',
      name: name || data.user.email
    });
    alert('Account created successfully!');
  }
}
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    setUser(null);
    setChapters([]);
    setEmail('');
    setPassword('');
    setName('');
    setAuthError('');
    window.location.reload();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

  // CRUD operations with database sync
  const addChapter = async () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      name: 'New Chapter',
      topics: []
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    await supabase.from('chapters').insert([newChapter]);
    setEditingChapter(newChapter);
  };

  const updateChapter = async (id: string, name: string) => {
    const updated = chapters.map(c => c.id === id ? { ...c, name } : c);
    setChapters(updated);
    await supabase.from('chapters').update({ name }).eq('id', id);
    setEditingChapter(null);
  };

  const deleteChapter = async (id: string) => {
    if (confirm('Delete this chapter and all its content?')) {
      const updated = chapters.filter(c => c.id !== id);
      setChapters(updated);
      await supabase.from('chapters').delete().eq('id', id);
    }
  };

  const addTopic = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const newTopic: Topic = {
      id: Date.now().toString(),
      name: 'New Topic',
      molecules: []
    };
    
    const updated = chapters.map(c => 
      c.id === chapterId 
        ? { ...c, topics: [...c.topics, newTopic] }
        : c
    );
    setChapters(updated);
    supabase.from('chapters').update({ topics: updated.find(c => c.id === chapterId)!.topics }).eq('id', chapterId);
    setEditingTopic({ chapter, topic: newTopic });
  };

  const updateTopic = (chapterId: string, topicId: string, name: string) => {
    const updated = chapters.map(c => 
      c.id === chapterId 
        ? { ...c, topics: c.topics.map(t => t.id === topicId ? { ...t, name } : t) }
        : c
    );
    setChapters(updated);
    supabase.from('chapters').update({ topics: updated.find(c => c.id === chapterId)!.topics }).eq('id', chapterId);
    setEditingTopic(null);
  };

  const deleteTopic = (chapterId: string, topicId: string) => {
    if (confirm('Delete this topic and all its molecules?')) {
      const updated = chapters.map(c => 
        c.id === chapterId 
          ? { ...c, topics: c.topics.filter(t => t.id !== topicId) }
          : c
      );
      setChapters(updated);
      supabase.from('chapters').update({ topics: updated.find(c => c.id === chapterId)!.topics }).eq('id', chapterId);
    }
  };

  const addMolecule = (chapterId: string, topicId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const topic = chapter?.topics.find(t => t.id === topicId);
    if (!chapter || !topic) return;
    
    const newMolecule: Molecule = {
      id: Date.now().toString(),
      name: 'New Molecule',
      smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
      formula: 'C₉H₈O₄',
      description: 'Enter description here...'
    };
    
    setEditingMolecule({ chapter, topic, molecule: newMolecule });
    setShowPubchemModal(false);
  };

  const saveMolecule = (chapterId: string, topicId: string, molecule: Molecule) => {
    const updated = chapters.map(c => 
      c.id === chapterId 
        ? {
            ...c,
            topics: c.topics.map(t => 
              t.id === topicId
                ? {
                    ...t,
                    molecules: t.molecules.some(m => m.id === molecule.id)
                      ? t.molecules.map(m => m.id === molecule.id ? molecule : m)
                      : [...t.molecules, molecule]
                  }
                : t
            )
          }
        : c
    );
    setChapters(updated);
    supabase.from('chapters').update({ topics: updated.find(c => c.id === chapterId)!.topics }).eq('id', chapterId);
    setEditingMolecule(null);
  };

  const deleteMolecule = (chapterId: string, topicId: string, moleculeId: string) => {
    if (confirm('Delete this molecule?')) {
      const updated = chapters.map(c => 
        c.id === chapterId 
          ? {
              ...c,
              topics: c.topics.map(t => 
                t.id === topicId
                  ? { ...t, molecules: t.molecules.filter(m => m.id !== moleculeId) }
                  : t
              )
            }
          : c
      );
      setChapters(updated);
      supabase.from('chapters').update({ topics: updated.find(c => c.id === chapterId)!.topics }).eq('id', chapterId);
    }
  };

  // ==================== AI DESCRIPTION GENERATOR ====================
  const generateAIDescription = async (molecule: Molecule) => {
    setAiGenerating(true);
    try {
      // Simulated AI generation - replace with actual Claude API call
      const aiDescription = `${molecule.name} is a pharmaceutical compound with the molecular formula ${molecule.formula}.

Mechanism of Action:
This compound works by [AI would analyze the SMILES structure and provide mechanism].

Pharmacological Class:
Based on its chemical structure, this belongs to [AI would classify].

Clinical Uses:
- Primary indication: [AI would determine based on structure]
- Secondary uses: [AI would suggest]

Side Effects:
Common side effects may include [AI would predict based on similar compounds].

Key Facts:
- SMILES: ${molecule.smiles}
- Molecular Weight: [AI would calculate]
- Important interactions: [AI would suggest]

Note: This is an AI-generated description. Please verify with authoritative pharmaceutical references.`;

      setEditingMolecule(prev => prev ? {
        ...prev,
        molecule: prev.molecule ? { ...prev.molecule, description: aiDescription } : null
      } : null);
      
    } catch (error) {
      console.error('AI generation error:', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // ==================== PUBCHEM SEARCH ====================
  const searchPubChem = async () => {
    if (!pubchemSearchQuery.trim()) return;
    
    setIsSearchingPubchem(true);
    try {
      // Search PubChem by name
      const searchResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(pubchemSearchQuery)}/cids/JSON`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.IdentifierList?.CID) {
        const cids = searchData.IdentifierList.CID.slice(0, 5); // Get first 5 results
        const results = [];
        
        for (const cid of cids) {
          // Get compound details
          const detailsResponse = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`
          );
          const details = await detailsResponse.json();
          
          if (details.PropertyTable?.Properties?.[0]) {
            results.push({
              cid,
              ...details.PropertyTable.Properties[0]
            });
          }
        }
        
        setPubchemResults(results);
      } else {
        setPubchemResults([]);
        alert('No compounds found. Try a different name.');
      }
    } catch (error) {
      console.error('PubChem search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearchingPubchem(false);
    }
  };

  const importFromPubChem = (result: any) => {
    if (!editingMolecule) return;
    
    const importedMolecule: Molecule = {
      id: editingMolecule.molecule?.id || Date.now().toString(),
      name: result.IUPACName || pubchemSearchQuery,
      smiles: result.CanonicalSMILES || '',
      formula: result.MolecularFormula || '',
      description: `Imported from PubChem (CID: ${result.cid})
      
Molecular Weight: ${result.MolecularWeight || 'N/A'}

This molecule was automatically imported from the PubChem database. Add additional pharmacological information, mechanism of action, and clinical uses.`,
      molecularWeight: result.MolecularWeight
    };
    
    setEditingMolecule({
      ...editingMolecule,
      molecule: importedMolecule
    });
    setShowPubchemModal(false);
  };

  // ==================== QUIZ MODE ====================
  const generateQuiz = () => {
    const allMolecules = chapters.flatMap(c => 
      c.topics.flatMap(t => t.molecules)
    );
    
    if (allMolecules.length < 4) {
      alert('You need at least 4 molecules to generate a quiz!');
      return;
    }
    
    const questions: QuizQuestion[] = [];
    const usedMolecules = new Set<string>();
    
    // Generate 5 questions (or fewer if not enough molecules)
    const numQuestions = Math.min(5, allMolecules.length);
    
    for (let i = 0; i < numQuestions; i++) {
      // Pick a random molecule that hasn't been used
      let molecule;
      do {
        molecule = allMolecules[Math.floor(Math.random() * allMolecules.length)];
      } while (usedMolecules.has(molecule.id));
      
      usedMolecules.add(molecule.id);
      
      // Question type 1: Name from structure
      if (Math.random() > 0.5) {
        const otherMolecules = allMolecules.filter(m => m.id !== molecule.id);
        const wrongAnswers = [];
        for (let j = 0; j < 3; j++) {
          const wrong = otherMolecules[Math.floor(Math.random() * otherMolecules.length)];
          if (!wrongAnswers.includes(wrong.name)) {
            wrongAnswers.push(wrong.name);
          }
        }
        
        const options = [molecule.name, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        questions.push({
          question: `What is the name of this molecule?\nFormula: ${molecule.formula}\nSMILES: ${molecule.smiles}`,
          options,
          correctAnswer: options.indexOf(molecule.name),
          explanation: `This is ${molecule.name}. ${molecule.description.substring(0, 150)}...`
        });
      } else {
        // Question type 2: Formula from name
        const otherMolecules = allMolecules.filter(m => m.id !== molecule.id);
        const wrongAnswers = [];
        for (let j = 0; j < 3; j++) {
          const wrong = otherMolecules[Math.floor(Math.random() * otherMolecules.length)];
          if (!wrongAnswers.includes(wrong.formula)) {
            wrongAnswers.push(wrong.formula);
          }
        }
        
        const options = [molecule.formula, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        questions.push({
          question: `What is the molecular formula of ${molecule.name}?`,
          options,
          correctAnswer: options.indexOf(molecule.formula),
          explanation: `${molecule.name} has the formula ${molecule.formula}.`
        });
      }
    }
    
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setQuizScore({ correct: 0, total: questions.length });
    setQuizActive(true);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowQuizResult(true);
    
    if (answerIndex === quizQuestions[currentQuestionIndex].correctAnswer) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowQuizResult(false);
    } else {
      // Quiz finished
      setQuizActive(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setQuizScore({ correct: 0, total: quizQuestions.length });
    setQuizActive(true);
  };

  // Search
  const searchResults = chapters.flatMap(chapter =>
    chapter.topics.flatMap(topic =>
      topic.molecules
        .filter(mol =>
          mol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mol.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mol.smiles.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(mol => ({ chapter, topic, molecule: mol }))
    )
  );

  // Login Screen
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-teal-50 to-green-50'}`}>
        <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl mb-4">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              PharmaStudy Pro
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-Powered Molecular Learning
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-teal-500'
                  } focus:outline-none`}
                  placeholder="Enter your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-teal-500'
                } focus:outline-none`}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-teal-500'
                  } focus:outline-none`}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              ✨ <strong>New in Phase 2:</strong>
            </p>
            <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>🗄️ Cloud database sync</li>
              <li>🤖 AI description generator</li>
              <li>🔬 PubChem molecule search</li>
              <li>🧠 Interactive quiz mode</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl hidden sm:block">PharmaStudy</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>Pro Edition</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 h-[calc(100vh-57px)] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-transform z-40 overflow-y-auto`}>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('chapters')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'chapters'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Chapters</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Search</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="font-medium">Quiz Mode</span>
              <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
            </button>
          </nav>

          <div className={`p-4 mt-auto border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-900 to-teal-900' : 'bg-gradient-to-br from-blue-50 to-teal-50'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.name || user.email.split('@')[0]}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {user.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Pro Account</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - CONTINUING IN NEXT PART DUE TO LENGTH */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {chapters.length}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chapters</p>
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                      <FlaskConical className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {chapters.reduce((sum, c) => sum + c.topics.reduce((s, t) => s + t.molecules.length, 0), 0)}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Molecules</p>
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {chapters.reduce((sum, c) => sum + c.topics.length, 0)}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Topics</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-purple-50 to-pink-50'} rounded-xl p-6 mb-8`}>
                <div className="flex items-start gap-4">
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Phase 2 Features Active!</h3>
                    <ul className="space-y-1 text-sm">
                      <li>✨ AI-powered description generation</li>
                      <li>🔬 PubChem database integration</li>
                      <li>🗄️ Cloud sync (coming soon with Supabase)</li>
                      <li>🧠 Interactive quiz mode</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4">Recent Chapters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.slice(0, 4).map(chapter => (
                  <div key={chapter.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                    onClick={() => setActiveTab('chapters')}>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {chapter.name}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {chapter.topics.length} topics • {chapter.topics.reduce((sum, t) => sum + t.molecules.length, 0)} molecules
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

{/* CHAPTERS VIEW - Same as before but with PubChem button */}
          {activeTab === 'chapters' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Chapters & Topics</h1>
                <button
                  onClick={addChapter}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Chapter</span>
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                  <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-bold mb-2">No chapters yet</h3>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Click "Add Chapter" to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chapters.map(chapter => (
                    <div key={chapter.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                      <div className="flex items-center justify-between mb-4">
                        {editingChapter?.id === chapter.id ? (
                          <input
                            type="text"
                            value={editingChapter.name}
                            onChange={(e) => setEditingChapter({ ...editingChapter, name: e.target.value })}
                            onBlur={() => updateChapter(chapter.id, editingChapter.name)}
                            onKeyPress={(e) => e.key === 'Enter' && updateChapter(chapter.id, editingChapter.name)}
                            className={`text-2xl font-bold border-b-2 border-teal-500 focus:outline-none ${
                              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                            } px-2 py-1`}
                            autoFocus
                          />
                        ) : (
                          <h2 className="text-2xl font-bold">{chapter.name}</h2>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingChapter(chapter)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteChapter(chapter.id)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => addTopic(chapter.id)}
                        className={`w-full mb-4 flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'} text-blue-600 px-4 py-2 rounded-lg transition-all`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Topic</span>
                      </button>

                      <div className="space-y-4">
                        {chapter.topics.map(topic => (
                          <div key={topic.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              {editingTopic?.topic?.id === topic.id ? (
                                <input
                                  type="text"
                                  value={editingTopic.topic.name}
                                  onChange={(e) => setEditingTopic({ ...editingTopic, topic: { ...editingTopic.topic!, name: e.target.value } })}
                                  onBlur={() => updateTopic(chapter.id, topic.id, editingTopic.topic!.name)}
                                  onKeyPress={(e) => e.key === 'Enter' && updateTopic(chapter.id, topic.id, editingTopic.topic!.name)}
                                  className={`text-lg font-semibold border-b-2 border-teal-500 focus:outline-none ${
                                    darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                                  } px-2 py-1`}
                                  autoFocus
                                />
                              ) : (
                                <h3 className="text-lg font-semibold">{topic.name}</h3>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingTopic({ chapter, topic })}
                                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteTopic(chapter.id, topic.id)}
                                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2 mb-3">
                              <button
                                onClick={() => addMolecule(chapter.id, topic.id)}
                                className={`flex-1 flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'} px-3 py-2 rounded-lg text-sm transition-all`}
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add Manually</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMolecule({ 
                                    chapter, 
                                    topic, 
                                    molecule: {
                                      id: Date.now().toString(),
                                      name: '',
                                      smiles: '',
                                      formula: '',
                                      description: ''
                                    }
                                  });
                                  setShowPubchemModal(true);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white px-3 py-2 rounded-lg text-sm transition-all`}
                              >
                                <Search className="w-4 h-4" />
                                <span>PubChem</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {topic.molecules.map(molecule => (
                                <div key={molecule.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-sm">{molecule.name}</h4>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setEditingMolecule({ chapter, topic, molecule })}
                                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteMolecule(chapter.id, topic.id, molecule.id)}
                                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{molecule.formula}</p>
                                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded p-2 mb-2`}>
                                    <img
                                      src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(molecule.smiles)}/PNG`}
                                      alt={molecule.name}
                                      className="w-full h-32 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                    {molecule.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEARCH VIEW - Same as before */}
          {activeTab === 'search' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Search Molecules</h1>
              <div className="mb-6">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, formula, description, or SMILES..."
                    className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-teal-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-teal-500'
                    } focus:outline-none`}
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="space-y-4">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  {searchResults.map(({ chapter, topic, molecule }) => (
                    <div key={molecule.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 flex items-center justify-center md:w-64`}>
                          <img
                            src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(molecule.smiles)}/PNG`}
                            alt={molecule.name}
                            className="w-full h-48 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            {chapter.name} → {topic.name}
                          </div>
                          <h3 className="text-2xl font-bold mb-2">{molecule.name}</h3>
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{molecule.formula}</p>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>{molecule.description}</p>
                          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded p-2 text-xs font-mono`}>
                            SMILES: {molecule.smiles}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUIZ MODE */}
          {activeTab === 'quiz' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Quiz Mode</h1>
              
              {!quizActive && quizQuestions.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                  <Brain className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className="text-2xl font-bold mb-4">Test Your Knowledge!</h3>
                  <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Generate a quiz from your molecules to test what you've learned.
                  </p>
                  <button
                    onClick={generateQuiz}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 mx-auto"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Quiz</span>
                  </button>
                </div>
              ) : !quizActive && quizQuestions.length > 0 ? (
                // Quiz finished
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                    quizScore.correct / quizScore.total >= 0.7 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-yellow-100 dark:bg-yellow-900'
                  }`}>
                    <span className="text-4xl font-bold">
                      {Math.round((quizScore.correct / quizScore.total) * 100)}%
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
                  <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    You got {quizScore.correct} out of {quizScore.total} questions correct!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={restartQuiz}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Try Again</span>
                    </button>
                    <button
                      onClick={generateQuiz}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>New Quiz</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Active quiz
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-3xl mx-auto`}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Question {currentQuestionIndex + 1} of {quizQuestions.length}
                      </span>
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Score: {quizScore.correct}/{currentQuestionIndex}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-6 whitespace-pre-line">
                    {quizQuestions[currentQuestionIndex].question}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !showQuizResult && handleQuizAnswer(index)}
                        disabled={showQuizResult}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          showQuizResult
                            ? index === quizQuestions[currentQuestionIndex].correctAnswer
                              ? 'bg-green-500 text-white'
                              : index === selectedAnswer
                              ? 'bg-red-500 text-white'
                              : darkMode ? 'bg-gray-700' : 'bg-gray-100'
                            : darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {showQuizResult && (
                            index === quizQuestions[currentQuestionIndex].correctAnswer ? (
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : index === selectedAnswer ? (
                              <XCircle className="w-5 h-5 flex-shrink-0" />
                            ) : null
                          )}
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {showQuizResult && (
                    <div className={`p-4 rounded-lg mb-6 ${
                      selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <p className="font-medium mb-2">
                        {selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer
                          ? '✅ Correct!'
                          : '❌ Incorrect'}
                      </p>
                      <p className="text-sm">
                        {quizQuestions[currentQuestionIndex].explanation}
                      </p>
                    </div>
                  )}

                  {showQuizResult && (
                    <button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* PubChem Search Modal */}
      {showPubchemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Search PubChem Database</h2>
              <button
                onClick={() => setShowPubchemModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pubchemSearchQuery}
                  onChange={(e) => setPubchemSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPubChem()}
                  placeholder="Enter molecule name (e.g., aspirin, ibuprofen)"
                  className={`flex-1 px-4 py-3 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-teal-500`}
                />
                <button
                  onClick={searchPubChem}
                  disabled={isSearchingPubchem}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSearchingPubchem ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {pubchemResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold mb-4">Search Results:</h3>
                {pubchemResults.map((result) => (
                  <div key={result.cid} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-start gap-4`}>
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded p-2 flex-shrink-0`}>
                      <img
                        src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(result.CanonicalSMILES)}/PNG?image_size=200x200`}
                        alt={result.IUPACName}
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-2">{result.IUPACName || pubchemSearchQuery}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        Formula: {result.MolecularFormula}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        Weight: {result.MolecularWeight}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} font-mono mb-3`}>
                        CID: {result.cid}
                      </p>
                      <button
                        onClick={() => importFromPubChem(result)}
                        className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                      >
                        Import This Molecule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                💡 <strong>Tip:</strong> Search by common name (aspirin), chemical name (acetylsalicylic acid), or drug name. 
                PubChem contains over 100 million compounds!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Molecule Edit Modal with AI */}
      {editingMolecule && !showPubchemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <h2 className="text-2xl font-bold mb-4">
              {editingMolecule.molecule?.name || 'New Molecule'}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const molecule: Molecule = {
                id: editingMolecule.molecule?.id || Date.now().toString(),
                name: formData.get('name') as string,
                smiles: formData.get('smiles') as string,
                formula: formData.get('formula') as string,
                description: formData.get('description') as string,
              };
              saveMolecule(editingMolecule.chapter.id, editingMolecule.topic.id, molecule);
            }} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Molecule Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingMolecule.molecule?.name}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-teal-500`}
                  placeholder="e.g., Aspirin"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  SMILES String
                </label>
                <input
                  type="text"
                  name="smiles"
                  defaultValue={editingMolecule.molecule?.smiles}
                  className={`w-full px-4 py-2 rounded-lg border-2 font-mono text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-teal-500`}
                  placeholder="e.g., CC(=O)OC1=CC=CC=C1C(=O)O"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Molecular Formula
                </label>
                <input
                  type="text"
                  name="formula"
                  defaultValue={editingMolecule.molecule?.formula}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-teal-500`}
                  placeholder="e.g., C₉H₈O₄"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={() => editingMolecule.molecule && generateAIDescription(editingMolecule.molecule)}
                    disabled={aiGenerating}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiGenerating ? 'Generating...' : 'AI Generate'}</span>
                  </button>
                </div>
                <textarea
                  name="description"
                  defaultValue={editingMolecule.molecule?.description}
                  value={editingMolecule.molecule?.description}
                  onChange={(e) => setEditingMolecule(prev => prev ? {
                    ...prev,
                    molecule: prev.molecule ? { ...prev.molecule, description: e.target.value } : null
                  } : null)}
                  rows={6}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:border-teal-500`}
                  placeholder="Enter pharmacological details, mechanism of action, uses, side effects..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all"
                >
                  Save Molecule
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMolecule(null)}
                  className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} py-2 px-4 rounded-lg transition-all`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
