import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Moon, Sun, Home, BookOpen, FlaskConical, Menu, X, LogOut, Eye, EyeOff, Sparkles, Brain, PlayCircle, CheckCircle, XCircle, ChevronRight, ArrowLeft, Maximize2, ZoomIn, ZoomOut, Wand2, Download, Share2 } from 'lucide-react';
import { supabase } from './supabase';
// Types
interface User {
  id: string;
  email: string;
  name?: string;
}

interface Molecule {
  id: string;
  topic_id: string;
  name: string;
  smiles: string;
  formula: string;
  description: string;
  image_url?: string;
  cas_number?: string;
  molecular_weight?: string;
  pubchem_cid?: string;
  drug_category?: string;
  primary_function?: string;
  // Mechanism fields
  drug_class?: string;
  route_of_administration?: string;
  target_receptor?: string;
  onset_time?: string;
  peak_time?: string;
  duration?: string;
  metabolism?: string;
  excretion?: string;
  side_effects?: string;
  molecule_type?: string;
  body_effect?: string;
}

interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  molecules: Molecule[];
}

interface Chapter {
  id: string;
  user_id: string;
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
export default function Pharmakinase() {
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // UI states
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browse' | 'search' | 'quiz'>('dashboard');
  
  // Navigation states - 3-LEVEL HIERARCHY
  const [currentView, setCurrentView] = useState<'chapters' | 'topics' | 'molecules'>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // Data states
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing states
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingMolecule, setEditingMolecule] = useState<Molecule | null>(null);
  
  // Modal states
  const [viewingMolecule, setViewingMolecule] = useState<Molecule | null>(null);
  const [showMoleculeModal, setShowMoleculeModal] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  
  // Add Wizard states
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<'name' | 'method' | 'generating' | 'edit'>('name');
  const [wizardName, setWizardName] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizActive, setQuizActive] = useState(false);
  // Flashcard states
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcards, setFlashcards] = useState<Molecule[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState({ correct: 0, wrong: 0 });
  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('pharmaDarkMode', darkMode.toString());
  }, [darkMode]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email
        });
        await loadChapters();
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
    
    const savedDarkMode = localStorage.getItem('pharmaDarkMode');
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
  };

  const loadChapters = async () => {
    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .order('created_at', { ascending: true });

      if (chaptersError) throw chaptersError;

      if (!chaptersData || chaptersData.length === 0) {
        setChapters([]);
        return;
      }

      const chaptersWithTopics = await Promise.all(
        chaptersData.map(async (chapter) => {
          const { data: topicsData } = await supabase
            .from('topics')
            .select('*')
            .eq('chapter_id', chapter.id)
            .order('created_at', { ascending: true });

          const topicsWithMolecules = await Promise.all(
            (topicsData || []).map(async (topic) => {
              const { data: moleculesData } = await supabase
                .from('molecules')
                .select('*')
                .eq('topic_id', topic.id)
                .order('created_at', { ascending: true });

              return {
                ...topic,
                molecules: moleculesData || []
              };
            })
          );

          return {
            ...chapter,
            topics: topicsWithMolecules
          };
        })
      );

      setChapters(chaptersWithTopics);
    } catch (error) {
      console.error('Error loading chapters:', error);
      setChapters([]);
    }
  };

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
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
          
          setTimeout(async () => {
            await loadChapters();
            alert('✅ Account created! You can now add chapters and molecules.');
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed.');
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

  // Navigation helpers
  const goToChapters = () => {
    setCurrentView('chapters');
    setSelectedChapter(null);
    setSelectedTopic(null);
  };

  const goToTopics = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentView('topics');
    setSelectedTopic(null);
  };

  const goToMolecules = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('molecules');
  };

  const openMoleculeDetail = (molecule: Molecule) => {
    setViewingMolecule(molecule);
    setShowMoleculeModal(true);
    setImageZoomed(false);
  };

  // CRUD operations - Chapters
  const addChapter = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert([{ name: 'New Chapter', user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const newChapter = { ...data, topics: [] };
      setChapters([...chapters, newChapter]);
      setEditingChapter(newChapter);
    } catch (error) {
      console.error('Error adding chapter:', error);
      alert('Failed to add chapter');
    }
  };

  const updateChapter = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setChapters(chapters.map(c => c.id === id ? { ...c, name } : c));
      setEditingChapter(null);
      if (selectedChapter?.id === id) {
        setSelectedChapter({ ...selectedChapter, name });
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert('Failed to update chapter');
    }
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter and all its content?')) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChapters(chapters.filter(c => c.id !== id));
      if (selectedChapter?.id === id) {
        goToChapters();
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter');
    }
  };

  // CRUD operations - Topics
  const addTopic = async () => {
    if (!selectedChapter) return;
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([{ name: 'New Topic', chapter_id: selectedChapter.id }])
        .select()
        .single();

      if (error) throw error;

      const newTopic = { ...data, molecules: [] };
      const updatedChapter = {
        ...selectedChapter,
        topics: [...selectedChapter.topics, newTopic]
      };
      
      setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
      setSelectedChapter(updatedChapter);
      setEditingTopic(newTopic);
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Failed to add topic');
    }
  };

  const updateTopic = async (id: string, name: string) => {
    if (!selectedChapter) return;
    
    try {
      const { error } = await supabase
        .from('topics')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      const updatedChapter = {
        ...selectedChapter,
        topics: selectedChapter.topics.map(t => t.id === id ? { ...t, name } : t)
      };
      
      setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
      setSelectedChapter(updatedChapter);
      setEditingTopic(null);
      
      if (selectedTopic?.id === id) {
        setSelectedTopic({ ...selectedTopic, name });
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      alert('Failed to update topic');
    }
  };

  const deleteTopic = async (id: string) => {
    if (!selectedChapter || !confirm('Delete this topic and all its molecules?')) return;
    
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedChapter = {
        ...selectedChapter,
        topics: selectedChapter.topics.filter(t => t.id !== id)
      };
      
      setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
      setSelectedChapter(updatedChapter);
      
      if (selectedTopic?.id === id) {
        setCurrentView('topics');
        setSelectedTopic(null);
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };
  // CRUD operations - Molecules with WIZARD
  const startAddMolecule = () => {
    setWizardName('');
    setWizardStep('name');
    setShowAddWizard(true);
    setEditingMolecule(null);
  };

  const proceedToMethod = () => {
    if (!wizardName.trim()) {
      alert('Please enter a molecule name');
      return;
    }
    setWizardStep('method');
  };

  const generateWithAI = async () => {
    if (!wizardName.trim() || !selectedTopic) return;
    
    setWizardStep('generating');
    setAiGenerating(true);
    
    try {
      const searchResponse = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(wizardName)}/cids/JSON`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.IdentifierList?.CID) {
        const cid = searchData.IdentifierList.CID[0];
        
        const detailsResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`
        );
        const details = await detailsResponse.json();
        const props = details.PropertyTable.Properties[0];
        
        const aiDescription = `${wizardName}

📋 BASIC PROPERTIES:
• IUPAC Name: ${props.IUPACName || wizardName}
• Molecular Weight: ${props.MolecularWeight} g/mol
• PubChem CID: ${cid}

📖 DESCRIPTION:
[Add detailed pharmacological description here]

⚙️ MECHANISM OF ACTION:
[Describe how this drug works at the molecular level]

💊 PHARMACOKINETICS:
• Absorption: [Add details]
• Distribution: [Add details]  
• Metabolism: [Add metabolic pathway]
• Excretion: [Add excretion route]

⚠️ SIDE EFFECTS:
Common: [List common side effects]
Serious: [List serious adverse effects]

🎯 CLINICAL USES:
• Primary indication: [Main therapeutic use]
• Secondary uses: [Other approved uses]

📚 NOTES:
Verify all information with official drug references.`;

        setEditingMolecule({
          topic_id: selectedTopic.id,
          name: wizardName,
          smiles: props.CanonicalSMILES || '',
          formula: props.MolecularFormula || '',
          description: aiDescription,
          molecular_weight: props.MolecularWeight?.toString() || '',
          pubchem_cid: cid.toString(),
          image_url: `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`
        } as Molecule);
      } else {
        const templateDescription = `${wizardName}

📋 PROPERTIES:
[Add molecular properties]

📖 DESCRIPTION:
[Add detailed description]

⚙️ MECHANISM OF ACTION:
[Describe mechanism]

💊 PHARMACOKINETICS:
[Add details]

⚠️ SIDE EFFECTS:
[List effects]

🎯 CLINICAL USES:
[Add uses]`;

        setEditingMolecule({
          topic_id: selectedTopic.id,
          name: wizardName,
          smiles: '',
          formula: '',
          description: templateDescription
        } as Molecule);
      }
      
      setWizardStep('edit');
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to fetch from PubChem. You can continue manually.');
      setWizardStep('edit');
    } finally {
      setAiGenerating(false);
    }
  };

  const continueManually = () => {
    if (!selectedTopic) return;
    
    setEditingMolecule({
      topic_id: selectedTopic.id,
      name: wizardName,
      smiles: '',
      formula: '',
      description: ''
    } as Molecule);
    setWizardStep('edit');
  };

const saveMolecule = async () => {
    if (!selectedChapter || !selectedTopic || !editingMolecule) return;
    
    if (!editingMolecule.name?.trim()) {
      alert('Please enter a molecule name');
      return;
    }
    
    
    try {
 const moleculeData = {
  name: editingMolecule.name.trim(),
  smiles: editingMolecule.smiles || '',
  formula: editingMolecule.formula.trim(),
  description: editingMolecule.description || '',
  image_url: editingMolecule.image_url || null,
  molecular_weight: editingMolecule.molecular_weight || null,
  cas_number: editingMolecule.cas_number || null,
  pubchem_cid: editingMolecule.pubchem_cid || null,
  drug_category: editingMolecule.drug_category || null,
  primary_function: editingMolecule.primary_function || null,
   drug_class: editingMolecule.drug_class || null,
  target_receptor: editingMolecule.target_receptor || null,
  route_of_administration: editingMolecule.route_of_administration || null,
  onset_time: editingMolecule.onset_time || null,
  peak_time: editingMolecule.peak_time || null,
  duration: editingMolecule.duration || null,
  metabolism: editingMolecule.metabolism || null,
  excretion: editingMolecule.excretion || null,
  side_effects: editingMolecule.side_effects || null
    };

      if (editingMolecule.id) {
        // UPDATE
        const { error } = await supabase
          .from('molecules')
          .update(moleculeData)
          .eq('id', editingMolecule.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        const updatedMolecule = { ...editingMolecule, ...moleculeData };
        const updatedTopic = {
          ...selectedTopic,
          molecules: selectedTopic.molecules.map(m => 
            m.id === editingMolecule.id ? updatedMolecule : m
          )
        };
        
        const updatedChapter = {
          ...selectedChapter,
          topics: selectedChapter.topics.map(t => 
            t.id === selectedTopic.id ? updatedTopic : t
          )
        };
        
        setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
        setSelectedChapter(updatedChapter);
        setSelectedTopic(updatedTopic);
        
        if (viewingMolecule?.id === editingMolecule.id) {
          setViewingMolecule(updatedMolecule);
        }
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('molecules')
          .insert([{
            ...moleculeData,
            topic_id: selectedTopic.id
          }])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No data returned from insert');
        }

        const updatedTopic = {
          ...selectedTopic,
          molecules: [...selectedTopic.molecules, data]
        };
        
        const updatedChapter = {
          ...selectedChapter,
          topics: selectedChapter.topics.map(t => 
            t.id === selectedTopic.id ? updatedTopic : t
          )
        };
        
        setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
        setSelectedChapter(updatedChapter);
        setSelectedTopic(updatedTopic);
      }

      setShowAddWizard(false);
      setEditingMolecule(null);
      setWizardName('');
      setWizardStep('name');
      
    } catch (error: any) {
      console.error('Save molecule error:', error);
      alert(`Failed to save: ${error.message || 'Unknown error'}`);
    }
  };
  const deleteMolecule = async (moleculeId: string) => {
    if (!selectedChapter || !selectedTopic || !confirm('Delete this molecule?')) return;
    
    try {
      const { error } = await supabase
        .from('molecules')
        .delete()
        .eq('id', moleculeId);

      if (error) throw error;

      const updatedTopic = {
        ...selectedTopic,
        molecules: selectedTopic.molecules.filter(m => m.id !== moleculeId)
      };
      
      const updatedChapter = {
        ...selectedChapter,
        topics: selectedChapter.topics.map(t => 
          t.id === selectedTopic.id ? updatedTopic : t
        )
      };
      
      setChapters(chapters.map(c => c.id === selectedChapter.id ? updatedChapter : c));
      setSelectedChapter(updatedChapter);
      setSelectedTopic(updatedTopic);
      
      if (viewingMolecule?.id === moleculeId) {
        setShowMoleculeModal(false);
        setViewingMolecule(null);
      }
    } catch (error) {
      console.error('Error deleting molecule:', error);
      alert('Failed to delete molecule');
    }
  };

  // Quiz functions
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
    const numQuestions = Math.min(5, allMolecules.length);
    
    for (let i = 0; i < numQuestions; i++) {
      let molecule;
      do {
        molecule = allMolecules[Math.floor(Math.random() * allMolecules.length)];
      } while (usedMolecules.has(molecule.id));
      
      usedMolecules.add(molecule.id);
      
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
          question: `What is the name of this molecule?\nFormula: ${molecule.formula}`,
          options,
          correctAnswer: options.indexOf(molecule.name),
          explanation: `This is ${molecule.name}.`
        });
      } else {
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
  // Flashcard functions
const startFlashcards = (chapterId?: string) => {
    let molecules;
    
    if (chapterId) {
      // Flashcards for specific chapter
      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter) return;
      
      molecules = chapter.topics.flatMap(t => t.molecules).filter(m => m.image_url);
    } else {
      // All molecules
      molecules = chapters.flatMap(c => 
        c.topics.flatMap(t => t.molecules)
      ).filter(m => m.image_url);
    }
    
    if (molecules.length === 0) {
      alert('Add molecules with images first!');
      return;
    }
    
    const shuffled = [...molecules].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentFlashcardIndex(0);
    setShowFlashcardAnswer(false);
    setFlashcardStats({ correct: 0, wrong: 0 });
    setFlashcardMode(true);
  };
  const revealFlashcardAnswer = () => {
    setShowFlashcardAnswer(true);
  };

  const markCorrect = () => {
    setFlashcardStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    nextFlashcard();
  };

  const markWrong = () => {
    setFlashcardStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    nextFlashcard();
  };

  const nextFlashcard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(prev => prev + 1);
      setShowFlashcardAnswer(false);
    } else {
      setFlashcardMode(false);
    }
  };
  // PDF Export function
  const exportChapterToPDF = async (chapter: Chapter) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF() as any;
      let yPos = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(chapter.name, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 15;
      
      // For each topic
      chapter.topics.forEach((topic, topicIdx) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${topicIdx + 1}. ${topic.name}`, 20, yPos);
        yPos += 10;
        
        // Molecules
        topic.molecules.forEach((mol, molIdx) => {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${topicIdx + 1}.${molIdx + 1} ${mol.name}`, 25, yPos);
          yPos += 7;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          if (mol.formula) {
            doc.text(`Formula: ${mol.formula}`, 30, yPos);
            yPos += 6;
          }
          
          if (mol.drug_category) {
            doc.text(`Category: ${mol.drug_category}`, 30, yPos);
            yPos += 6;
          }
          
          if (mol.primary_function) {
            const lines = doc.splitTextToSize(`Function: ${mol.primary_function}`, 160);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 5 + 3;
          }
          
          if (mol.description) {
            const lines = doc.splitTextToSize(mol.description, 160);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 5 + 5;
          }
          
          yPos += 5;
        });
        
        yPos += 5;
      });
      
      doc.save(`${chapter.name}.pdf`);
      alert('✅ PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    }
  };

  // Share chapter
  const shareChapter = async (chapter: Chapter) => {
    const shareData = {
      id: chapter.id,
      name: chapter.name,
      topics: chapter.topics.map(t => ({
        name: t.name,
        molecules: t.molecules.map(m => ({
          name: m.name,
          formula: m.formula,
          description: m.description,
          image_url: m.image_url,
          drug_category: m.drug_category,
          primary_function: m.primary_function
        }))
      }))
    };
    
    const jsonString = JSON.stringify(shareData);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    const shareUrl = `${window.location.origin}/?import=${base64}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('✅ Share link copied!\n\nAnyone with this link can import your chapter.');
    } catch (err) {
      prompt('Copy this link to share:', shareUrl);
    }
  };

  // Import chapter
  useEffect(() => {
    const checkImport = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const importData = urlParams.get('import');
      
      if (importData && user) {
        try {
          const jsonString = decodeURIComponent(escape(atob(importData)));
          const chapterData = JSON.parse(jsonString);
          
          if (confirm(`Import chapter "${chapterData.name}"?`)) {
            await importSharedChapter(chapterData);
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Import error:', err);
        }
      }
    };
    
    if (user) {
      checkImport();
    }
  }, [user]);

  const importSharedChapter = async (chapterData: any) => {
    if (!user) return;
    
    try {
      const { data: newChapter, error: chapterError } = await supabase
        .from('chapters')
        .insert([{ name: chapterData.name + ' (Imported)', user_id: user.id }])
        .select()
        .single();
      
      if (chapterError) throw chapterError;
      
      for (const topicData of chapterData.topics) {
        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert([{ name: topicData.name, chapter_id: newChapter.id }])
          .select()
          .single();
        
        if (topicError) throw topicError;
        
        for (const moleculeData of topicData.molecules) {
          await supabase
            .from('molecules')
            .insert([{
              topic_id: newTopic.id,
              ...moleculeData
            }]);
        }
      }
      
      await loadChapters();
      alert('✅ Chapter imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import chapter');
    }
  };  // Search
  const searchResults = chapters.flatMap(chapter =>
    chapter.topics.flatMap(topic =>
      topic.molecules
        .filter(mol =>
          mol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mol.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mol.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(mol => ({ chapter, topic, molecule: mol }))
    )
  );

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <FlaskConical className="w-16 h-16 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading PharmaStudy Pro...</p>
        </div>
      </div>
    );
  }
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
              Pharmakinase
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-Powered Molecular Learning
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsLogin(true); setAuthError(''); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setAuthError(''); }}
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
            {authError && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{authError}</p>
              </div>
            )}

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
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
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
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
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
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                  } focus:outline-none`}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
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
                <span className="font-bold text-xl hidden sm:block">Pharmakinase</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}>Enhanced</span>
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
              onClick={() => { setActiveTab('browse'); goToChapters(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Browse</span>
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
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Flashcards</span>
            </button>          </nav>

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
                <span className="text-xs font-medium text-yellow-400">Enhanced</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          {activeTab === 'browse' && (
            <div className={`mb-4 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <button 
                onClick={goToChapters}
                className={`hover:text-blue-500 transition-colors ${currentView === 'chapters' ? 'font-semibold text-blue-500' : ''}`}
              >
                📚 Chapters
              </button>
              
              {selectedChapter && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <button 
                    onClick={() => goToTopics(selectedChapter)}
                    className={`hover:text-blue-500 transition-colors ${currentView === 'topics' ? 'font-semibold text-blue-500' : ''}`}
                  >
                    {selectedChapter.name}
                  </button>
                </>
              )}
              
              {selectedTopic && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-semibold text-blue-500">{selectedTopic.name}</span>
                </>
              )}
            </div>
          )}

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

 <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800' : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'} border-2 rounded-xl p-6 mb-6`}>
                <div className="flex items-start gap-4">
                  <div className={`text-5xl ${darkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`}>
                    "
                  </div>
                  <div>
                    <p className={`text-lg italic mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      All things are poison, and nothing is without poison; the dosage alone makes it so a thing is not a poison.
                    </p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      — Paracelsus
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      Swiss physician and alchemist (1493-1541)
                    </p>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Recent Chapters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.slice(0, 4).map(chapter => (
                  <div key={chapter.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                    onClick={() => { setActiveTab('browse'); goToTopics(chapter); }}>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {chapter.name}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {chapter.topics.length} topics • {chapter.topics.reduce((sum, t) => sum + t.molecules.length, 0)} molecules
                    </p>
                  </div>
                ))}
                
                {chapters.length === 0 && (
                  <div className={`col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                    <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className="text-xl font-bold mb-2">No chapters yet</h3>
                    <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Start building your molecular library!
                    </p>
                    <button
                      onClick={() => { setActiveTab('browse'); goToChapters(); }}
                      className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      Create Your First Chapter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* BROWSE VIEW - 3-LEVEL NAVIGATION */}
          {activeTab === 'browse' && (
            <div>
              {/* Back Button */}
              {currentView !== 'chapters' && (
                <button
                  onClick={() => {
                    if (currentView === 'molecules') {
                      setCurrentView('topics');
                      setSelectedTopic(null);
                    } else if (currentView === 'topics') {
                      goToChapters();
                    }
                  }}
                  className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } transition-colors shadow`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {/* CHAPTERS VIEW */}
              {currentView === 'chapters' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Your Chapters</h1>
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
                      <BookOpen className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No chapters yet</h3>
                      <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create your first chapter to start organizing!
                      </p>
                      <button
                        onClick={addChapter}
                        className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Create First Chapter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chapters.map(chapter => (
                        <div
                          key={chapter.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'} rounded-xl p-6 transition-all cursor-pointer border-2 border-transparent hover:border-blue-500`}
                          onClick={() => goToTopics(chapter)}
                        >
                          {editingChapter?.id === chapter.id ? (
                            <input
                              type="text"
                              value={editingChapter.name}
                              onChange={(e) => setEditingChapter({ ...editingChapter, name: e.target.value })}
                              onBlur={() => updateChapter(chapter.id, editingChapter.name)}
                              onKeyPress={(e) => e.key === 'Enter' && updateChapter(chapter.id, editingChapter.name)}
                              className={`w-full px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} mb-3`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className="text-xl font-bold mb-3">{chapter.name}</h3>
                          )}
                          
                          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {chapter.topics.length} topics • {chapter.topics.reduce((sum, t) => sum + t.molecules.length, 0)} molecules
                          </p>
                          
 <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingChapter(chapter); }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-xs`}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); exportChapterToPDF(chapter); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs"
                              title="Export to PDF"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); shareChapter(chapter); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 text-xs"
                              title="Share chapter"
                            >
                              <Share2 className="w-3 h-3" />
                              Share
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div> 
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TOPICS VIEW */}
              {currentView === 'topics' && selectedChapter && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">{selectedChapter.name} - Topics</h1>
                    <button
                      onClick={addTopic}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Topic</span>
                    </button>
                  </div>

                  {selectedChapter.topics.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No topics yet</h3>
                      <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add your first topic to this chapter!
                      </p>
                      <button
                        onClick={addTopic}
                        className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Create First Topic
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedChapter.topics.map(topic => (
                        <div
                          key={topic.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'} rounded-xl p-6 transition-all cursor-pointer border-2 border-transparent hover:border-green-500`}
                          onClick={() => goToMolecules(topic)}
                        >
                          {editingTopic?.id === topic.id ? (
                            <input
                              type="text"
                              value={editingTopic.name}
                              onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                              onBlur={() => updateTopic(topic.id, editingTopic.name)}
                              onKeyPress={(e) => e.key === 'Enter' && updateTopic(topic.id, editingTopic.name)}
                              className={`w-full px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} mb-3`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className="text-xl font-bold mb-3">🧬 {topic.name}</h3>
                          )}
                          
                          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {topic.molecules.length} molecules
                          </p>
                          
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingTopic(topic); }}
                              className={`flex items-center gap-1 px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-sm`}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }}
                              className="flex items-center gap-1 px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MOLECULES VIEW */}
              {currentView === 'molecules' && selectedTopic && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">{selectedTopic.name} - Molecules</h1>
                    <button
                      onClick={startAddMolecule}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Molecule</span>
                    </button>
                  </div>
                  {/* Tabs pour filtrer par type */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTopicTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    topicTab === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({selectedTopic.molecules.length})
                </button>
                <button
                  onClick={() => setTopicTab('drug')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    topicTab === 'drug'
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  💊 Médicaments ({selectedTopic.molecules.filter(m => m.molecule_type === 'drug').length})
                </button>
                <button
                  onClick={() => setTopicTab('enzyme')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    topicTab === 'enzyme'
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🧬 Enzymes ({selectedTopic.molecules.filter(m => m.molecule_type === 'enzyme').length})
                </button>
                <button
                  onClick={() => setTopicTab('molecule')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    topicTab === 'molecule'
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ⚗️ Molécules ({selectedTopic.molecules.filter(m => m.molecule_type === 'molecule').length})
                </button>
              </div>

                  {selectedTopic.molecules.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No molecules yet</h3>
                      <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add your first molecule to this topic!
                      </p>
                      <button
                        onClick={startAddMolecule}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Add First Molecule
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {selectedTopic.molecules
  .filter(molecule => {
    if (topicTab === 'all') return true;
    return molecule.molecule_type === topicTab;
  })
  .map(molecule =>
                        <div
                          key={molecule.id}
                          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 transition-all hover:shadow-xl border-2 border-transparent hover:border-purple-500 cursor-pointer`}
                          onClick={() => openMoleculeDetail(molecule)}
                        >
                          {molecule.image_url && (
                            <div className="relative mb-3 bg-white rounded-lg p-2">
                              <img 
                                src={molecule.image_url} 
                                alt={molecule.name}
                                className="w-full h-32 object-contain"
                              />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                          
                          <h4 className="font-bold mb-1 truncate">{molecule.name}</h4>
                          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {molecule.formula}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} line-clamp-2`}>
                            {molecule.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEARCH VIEW */}
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
                    placeholder="Search by name, formula, or description..."
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
                    <div 
                      key={molecule.id} 
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all`}
                      onClick={() => openMoleculeDetail(molecule)}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {molecule.image_url && (
                          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 flex items-center justify-center md:w-64`}>
                            <img
                              src={molecule.image_url}
                              alt={molecule.name}
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            {chapter.name} → {topic.name}
                          </div>
                          <h3 className="text-2xl font-bold mb-2">{molecule.name}</h3>
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{molecule.formula}</p>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-3`}>{molecule.description}</p>
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
                    Generate a quiz from your molecules.
                  </p>
                  <button
                    onClick={generateQuiz}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all mx-auto"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Quiz</span>
                  </button>
                </div>
              ) : !quizActive && quizQuestions.length > 0 ? (
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
                    You got {quizScore.correct} out of {quizScore.total} correct!
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
          {/* FLASHCARDS MODE */}
          {activeTab === 'flashcards' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">🎴 Flashcards</h1>
              
{!flashcardMode ? (
                <div>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 text-center mb-6`}>
                    <Sparkles className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className="text-2xl font-bold mb-4">Learn with Flashcards!</h3>
                    <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Choose a chapter to study, or practice all molecules
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      onClick={() => startFlashcards()}
                      className={`${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-500' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400'} border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-xl`}
                    >
                      <Sparkles className="w-12 h-12 text-purple-500 mb-3" />
                      <h3 className="text-xl font-bold mb-2">🌟 All Chapters</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Practice with all your molecules
                      </p>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {chapters.flatMap(c => c.topics.flatMap(t => t.molecules)).filter(m => m.image_url).length} cards
                      </p>
                    </div>

                    {chapters.map(chapter => {
                      const moleculesWithImages = chapter.topics.flatMap(t => t.molecules).filter(m => m.image_url).length;
                      
                      if (moleculesWithImages === 0) return null;
                      
                      return (
                        <div
                          key={chapter.id}
                          onClick={() => startFlashcards(chapter.id)}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 hover:border-blue-500' : 'bg-white hover:shadow-xl border-gray-200 hover:border-blue-400'} border-2 rounded-xl p-6 cursor-pointer transition-all`}
                        >
                          <BookOpen className="w-12 h-12 text-blue-500 mb-3" />
                          <h3 className="text-xl font-bold mb-2">{chapter.name}</h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {chapter.topics.length} topics
                          </p>
                          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {moleculesWithImages} cards available
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {chapters.flatMap(c => c.topics.flatMap(t => t.molecules)).filter(m => m.image_url).length === 0 && (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center mt-6`}>
                      <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No flashcards available</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add molecules with images to create flashcards!
                      </p>
                    </div>
                  )}
                </div>
) : currentFlashcardIndex < flashcards.length ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-4xl mx-auto`}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Card {currentFlashcardIndex + 1} of {flashcards.length}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-green-600">✅ {flashcardStats.correct}</span>
                        <span className="text-sm font-medium text-red-600">❌ {flashcardStats.wrong}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${((currentFlashcardIndex + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-8 mb-6 flex items-center justify-center" style={{ minHeight: '300px' }}>
                    {flashcards[currentFlashcardIndex].image_url ? (
                      <img 
                        src={flashcards[currentFlashcardIndex].image_url} 
                        alt="Guess this molecule"
                        className="max-h-64 object-contain"
                      />
                    ) : (
                      <FlaskConical className="w-32 h-32 text-gray-400" />
                    )}
                  </div>

                  {!showFlashcardAnswer ? (
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-center">🤔 What is this molecule?</h3>
                      <button
                        onClick={revealFlashcardAnswer}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Reveal Answer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'} rounded-xl p-6`}>
                        <h3 className="text-2xl font-bold mb-4">{flashcards[currentFlashcardIndex].name}</h3>
                        
                        {flashcards[currentFlashcardIndex].formula && (
                          <p className={`text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Formula:</strong> {flashcards[currentFlashcardIndex].formula}
                          </p>
                        )}

                        {flashcards[currentFlashcardIndex].drug_category && (
                          <p className="mb-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {flashcards[currentFlashcardIndex].drug_category}
                            </span>
                          </p>
                        )}

                        {flashcards[currentFlashcardIndex].primary_function && (
                          <div className="mt-4">
                            <strong className="block mb-2">🎯 Primary Function:</strong>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {flashcards[currentFlashcardIndex].primary_function}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={markCorrect}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>I Got It!</span>
                          </div>
                        </button>
                        <button
                          onClick={markWrong}
                          className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <XCircle className="w-5 h-5" />
                            <span>Need Study</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                    flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong) >= 0.7 
                      ? 'bg-green-100 dark:bg-green-900' 
                      : 'bg-yellow-100 dark:bg-yellow-900'
                  }`}>
                    <span className="text-4xl font-bold">
                      {Math.round((flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong)) * 100)}%
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Complete!</h2>
                  <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Correct: {flashcardStats.correct} | Wrong: {flashcardStats.wrong}
                  </p>
                  <button
                    onClick={startFlashcards}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all mx-auto"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Again</span>
                  </button>
                </div>
              )}
            </div>
          )}        </main>
      </div>

{/* MOLECULE DETAIL MODAL - FULL SCREEN WITH ZOOM */}
          {showMoleculeModal && viewingMolecule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setShowMoleculeModal(false);
                        setViewingMolecule(null);
                      }}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingMolecule.name}</h2>
                      {viewingMolecule.molecule_type && (
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                          viewingMolecule.molecule_type === 'drug' 
                            ? 'bg-blue-100 text-blue-700'
                            : viewingMolecule.molecule_type === 'enzyme'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {viewingMolecule.molecule_type === 'drug' ? '💊 Médicament' : viewingMolecule.molecule_type === 'enzyme' ? '🧬 Enzyme' : '⚗️ Molécule'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingMolecule(viewingMolecule);
                        setShowAddWizard(true);
                        setWizardStep('edit');
                        setShowMoleculeModal(false);
                      }}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowMoleculeModal(false)}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Section */}
                    {viewingMolecule.image_url && (
                      <div className="bg-white rounded-xl p-6 flex items-center justify-center" style={{ minHeight: '400px' }}>
                        <img 
                          src={viewingMolecule.image_url} 
                          alt={viewingMolecule.name}
                          className="max-h-96 object-contain"
                        />
                      </div>
                    )}

                    {/* Details Section */}
                    <div className="space-y-6">
                      {/* Basic Info */}
                      {viewingMolecule.formula && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">Formula</h3>
                          <p className="text-lg font-mono">{viewingMolecule.formula}</p>
                        </div>
                      )}

                      {viewingMolecule.drug_category && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">Category</h3>
                          <span className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                            {viewingMolecule.drug_category}
                          </span>
                        </div>
                      )}

                      {viewingMolecule.primary_function && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">🎯 Primary Function</h3>
                          <p>{viewingMolecule.primary_function}</p>
                        </div>
                      )}

                      {viewingMolecule.description && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">📝 Description</h3>
                          <p className="whitespace-pre-wrap">{viewingMolecule.description}</p>
                        </div>
                      )}

                      {/* Body Effect (for molecules) */}
                      {viewingMolecule.body_effect && (
                        <div className="border-t pt-4 dark:border-gray-700">
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">💪 Effect on Body</h3>
                          <p className="whitespace-pre-wrap">{viewingMolecule.body_effect}</p>
                        </div>
                      )}

                      {/* Mechanism of Action */}
                      {(viewingMolecule.drug_class || viewingMolecule.target_receptor || viewingMolecule.route_of_administration) && (
                        <div className="border-t pt-4 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-3">⚙️ Mechanism of Action</h3>
                          <div className="space-y-2">
                            {viewingMolecule.drug_class && (
                              <div>
                                <span className="text-sm font-semibold text-gray-500">Class: </span>
                                <span>{viewingMolecule.drug_class}</span>
                              </div>
                            )}
                            {viewingMolecule.target_receptor && (
                              <div>
                                <span className="text-sm font-semibold text-gray-500">Target: </span>
                                <span>{viewingMolecule.target_receptor}</span>
                              </div>
                            )}
                            {viewingMolecule.route_of_administration && (
                              <div>
                                <span className="text-sm font-semibold text-gray-500">Route: </span>
                                <span>{viewingMolecule.route_of_administration}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pharmacokinetics (drugs only) */}
                      {viewingMolecule.molecule_type === 'drug' && (viewingMolecule.onset_time || viewingMolecule.peak_time || viewingMolecule.duration || viewingMolecule.metabolism || viewingMolecule.excretion) && (
                        <div className="border-t pt-4 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-3">💊 Pharmacokinetics</h3>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            {viewingMolecule.onset_time && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Onset</span>
                                <p className="text-sm">{viewingMolecule.onset_time}</p>
                              </div>
                            )}
                            {viewingMolecule.peak_time && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Peak</span>
                                <p className="text-sm">{viewingMolecule.peak_time}</p>
                              </div>
                            )}
                            {viewingMolecule.duration && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Duration</span>
                                <p className="text-sm">{viewingMolecule.duration}</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {viewingMolecule.metabolism && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Metabolism</span>
                                <p className="text-sm">{viewingMolecule.metabolism}</p>
                              </div>
                            )}
                            {viewingMolecule.excretion && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Excretion</span>
                                <p className="text-sm">{viewingMolecule.excretion}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Side Effects (drugs only) */}
                      {viewingMolecule.molecule_type === 'drug' && viewingMolecule.side_effects && (
                        <div className="border-t pt-4 dark:border-gray-700">
                          <h3 className="text-lg font-bold mb-3">⚠️ Side Effects</h3>
                          <p className="whitespace-pre-wrap">{viewingMolecule.side_effects}</p>
                        </div>
                      )}

                      {/* Additional Info */}
                      {(viewingMolecule.molecular_weight || viewingMolecule.cas_number || viewingMolecule.pubchem_cid) && (
                        <div className="border-t pt-4 dark:border-gray-700">
                          <h3 className="text-sm font-semibold mb-2 text-gray-500">Additional Information</h3>
                          <div className="space-y-1 text-sm">
                            {viewingMolecule.molecular_weight && <div>MW: {viewingMolecule.molecular_weight}</div>}
                            {viewingMolecule.cas_number && <div>CAS: {viewingMolecule.cas_number}</div>}
                            {viewingMolecule.pubchem_cid && <div>PubChem: {viewingMolecule.pubchem_cid}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      {/* ADD MOLECULE WIZARD */}
      {showAddWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto`}>
            {wizardStep === 'name' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Add New Molecule</h2>
                
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Molecule Name
                  </label>
                  <input
                    type="text"
                    value={wizardName}
                    onChange={(e) => setWizardName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && proceedToMethod()}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                    } focus:outline-none`}
                    placeholder="e.g., Aspirin, Ibuprofen..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={proceedToMethod}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setShowAddWizard(false);
                      setWizardName('');
                      setWizardStep('name');
                    }}
                    className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 'method' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Add: {wizardName}</h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  How would you like to add this molecule?
                </p>

                <div className="space-y-4 mb-6">
                  <button
                    onClick={generateWithAI}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      darkMode 
                        ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-500' 
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Wand2 className="w-8 h-8 text-purple-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold mb-2">🤖 AI Generate (Recommended)</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Automatically fetch structure, properties, and generate description from PubChem database
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={continueManually}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      darkMode 
                        ? 'border-gray-700 hover:border-gray-500' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Edit2 className="w-8 h-8 text-gray-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-bold mb-2">✍️ Enter Manually</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Add structure, properties, and description yourself
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setWizardStep('name')}
                  className={`w-full py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all`}
                >
                  Back
                </button>
              </div>
            )}

            {wizardStep === 'generating' && (
              <div className="p-12 text-center">
                <FlaskConical className="w-16 h-16 text-purple-500 animate-pulse mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Generating with AI...</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Fetching data from PubChem database
                </p>
              </div>
            )}
{wizardStep === 'edit' && editingMolecule && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Edit: {editingMolecule.name}</h2>
                
                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editingMolecule.name || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                    />
                  </div>

                  {editingMolecule.molecule_type !== 'enzyme' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Formula
                      </label>
                      <input
                        type="text"
                        value={editingMolecule.formula || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, formula: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border-2 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                        } focus:outline-none`}
                        placeholder="e.g., C₉H₈O₄"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      📷 Image URL
                    </label>
                    <input
                      type="text"
                      value={editingMolecule.image_url || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, image_url: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                      placeholder="Paste image URL here"
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      💡 Right-click any image → Copy image address → Paste here
                    </p>
                    {editingMolecule.image_url && (
                      <div className="mt-2 bg-white rounded-lg p-2">
                        <img 
                          src={editingMolecule.image_url} 
                          alt="Preview"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      🏷️ Category
                    </label>
                    <select
                      value={editingMolecule.drug_category || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, drug_category: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                    >
                      <option value="">Select category...</option>
                      <option value="antibiotic">💊 Antibiotic</option>
                      <option value="analgesic">🩹 Analgesic (Pain relief)</option>
                      <option value="antiviral">🦠 Antiviral</option>
                      <option value="cardiovascular">❤️ Cardiovascular</option>
                      <option value="neurological">🧠 Neurological</option>
                      <option value="antiinflammatory">🔥 Anti-inflammatory</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      🎯 Primary Function
                    </label>
                    <input
                      type="text"
                      value={editingMolecule.primary_function || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, primary_function: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                      placeholder="e.g., Reduces fever and pain"
                    />
                  </div>                      

<div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      🧪 Type
                    </label>
                    <select
                      value={editingMolecule.molecule_type || 'drug'}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, molecule_type: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                    >
                      <option value="drug">💊 Médicament</option>
                      <option value="enzyme">🧬 Enzyme</option>
                      <option value="molecule">⚗️ Molécule</option>
                    </select>
                  </div>                      
                    </label>
                    <input
                      type="text"
                      value={editingMolecule.smiles || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, smiles: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 font-mono text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={editingMolecule.description || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, description: e.target.value })}
                      rows={8}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                    />
                  </div>

                {editingMolecule.molecule_type === 'molecule' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        💪 Effect on Body
                      </label>
                      <textarea
                        value={editingMolecule.body_effect || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, body_effect: e.target.value })}
                        rows={4}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                        placeholder="Describe how this molecule affects the body..."
                      />
                    </div>
                  )} 
                  
                </div>
                <div className={`border-t pt-4 mt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">⚙️ Mechanism of Action</h3>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Drug Class (e.g., NSAID, Beta-blocker)"
                        value={editingMolecule.drug_class || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, drug_class: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                      
                      <input
                        type="text"
                        placeholder="Target Receptor (e.g., COX-2 enzyme)"
                        value={editingMolecule.target_receptor || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, target_receptor: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                      
                      <input
                        type="text"
                        placeholder="Route (e.g., Oral, IV, Topical)"
                        value={editingMolecule.route_of_administration || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, route_of_administration: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                    </div>
                  </div>

              {editingMolecule.molecule_type === 'drug' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">💊 Pharmacokinetics</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Onset (e.g., 30min)"
                        value={editingMolecule.onset_time || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, onset_time: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                      
                      <input
                        type="text"
                        placeholder="Peak (e.g., 1-2h)"
                        value={editingMolecule.peak_time || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, peak_time: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                      
                      <input
                        type="text"
                        placeholder="Duration (e.g., 4-6h)"
                        value={editingMolecule.duration || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, duration: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="text"
                        placeholder="Metabolism (e.g., Hepatic)"
                        value={editingMolecule.metabolism || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, metabolism: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                      
                      <input
                        type="text"
                        placeholder="Excretion (e.g., Renal)"
                        value={editingMolecule.excretion || ''}
                        onChange={(e) => setEditingMolecule({ ...editingMolecule, excretion: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } focus:outline-none focus:border-teal-500`}
                      />
                    </div>
                  </div>
                )}                

                {editingMolecule.molecule_type === 'drug' && (
                  <div className={`border-t pt-4 mt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">⚠️ Side Effects</h3>                
                    <textarea
                      placeholder="List common and serious side effects..."
                      value={editingMolecule.side_effects || ''}
                      onChange={(e) => setEditingMolecule({ ...editingMolecule, side_effects: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      } focus:outline-none focus:border-teal-500`}
                    />
                  </div>
               )}
            
            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={saveMolecule}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    💾 Save Molecule
                  </button>
                  <button
                    onClick={() => {
                      setShowAddWizard(false);
                      setEditingMolecule(null);
                      setWizardName('');
                      setWizardStep('name');
                    }}
                    className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
