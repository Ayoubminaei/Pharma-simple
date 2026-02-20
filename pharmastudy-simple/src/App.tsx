import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Moon, Sun, Home, BookOpen, FlaskConical, Menu, X, LogOut, Eye, EyeOff, Sparkles, Brain, PlayCircle, CheckCircle, XCircle, ChevronRight, ArrowLeft, Maximize2, ZoomIn, ZoomOut, Wand2, Download, Share2,Upload } from 'lucide-react';
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
  use_in_flashcards?: boolean;
}
// CourseNote uses the same structure as Molecule
type CourseNote = Molecule & {
  user_id: string;
};

interface MechanismStep {
  id: string;
  mechanism_id: string;
  step_number: number;
  title: string;
  explanation: string;
  image_url?: string;
}

interface Mechanism {
  id: string;
  user_id: string;
  topic_id: string;
  name: string;
  description?: string;
  steps: MechanismStep[];
  created_at?: string;
}

interface MechanismTopic {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  mechanisms: Mechanism[];
  created_at?: string;
}

interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  molecules: Molecule[];
  course_notes: CourseNote[];
  flashcard_config?: {
    question_types: Array<{
      type: string;
      enabled: boolean;
      label: string;
      field?: string;
    }>;
  };
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
interface HistologySlide {
  id: string;
  topic_id: string;
  name: string;
  image_url?: string;
  explanation: string;
  magnification?: string;
  staining?: string;
  created_at?: string;
}

interface HistologyTopic {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  slides: HistologySlide[];
  created_at?: string;
}
interface ExamFile {
  id: string;
  collection_id: string;
  name: string;
  file_url: string;
  file_type: 'exam' | 'course';
  year?: string;
  extracted_text?: string;
  processed: boolean;
  created_at?: string;
}

interface ExamQuestion {
  id: string;
  topic_id?: string;
  collection_id: string;
  question: string;
  answer?: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question_type: 'QCM' | 'Ouverte' | 'Calcul' | 'Vrai/Faux';
  options?: string[];
  correct_option?: number;
  source_year?: string;
  is_ai_generated: boolean;
  created_at?: string;
}

interface HotTopic {
  id: string;
  collection_id: string;
  title: string;
  description?: string;
  image_url?: string;
  slide_number?: string;
  frequency: number;
  exam_years: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  question_types: string[];
  questions?: ExamQuestion[];
  created_at?: string;
}

interface ExamCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  subject?: string;
  year?: string;
  files?: ExamFile[];
  hot_topics?: HotTopic[];
  created_at?: string;
}

// Image upload helper
const uploadImage = async (file: File, user: User | null): Promise<string | null> => {
  if (!user) return null;
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('molecule-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('molecule-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload image');
    return null;
  }
};
// Image Upload Component
const ImageUploader = ({ 
  value, 
  onChange, 
  darkMode,
  user
}: { 
  value: string; 
  onChange: (url: string) => void; 
  darkMode: boolean;
  user: { id: string } | null;
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    const url = await uploadImage(file, user);
    setUploading(false);
    
    if (url) {
      onChange(url);
    }
  };
  
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        📷 Image
      </label>
      
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setUploadMethod('url')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'url'
              ? 'bg-blue-500 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          🔗 URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            uploadMethod === 'file'
              ? 'bg-blue-500 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          📤 Upload
        </button>
      </div>
      
      {uploadMethod === 'url' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border-2 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
              : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
          } focus:outline-none`}
          placeholder="Paste image URL here"
        />
      )}
      
      {uploadMethod === 'file' && (
        <div>
          <label className={`block w-full cursor-pointer ${
            darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          } border-2 border-dashed rounded-lg p-8 text-center transition-all`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div>
                <FlaskConical className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-pulse" />
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Uploading...
                </p>
              </div>
            ) : (
              <div>
                <Upload className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Click to upload image
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
          </label>
        </div>
      )}
      
      {value && (
        <div className="mt-3 relative">
          <div className="bg-white rounded-lg p-2">
            <img 
              src={value} 
              alt="Preview"
              className="w-full h-32 object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function PharmaKinase() {
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
 const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
const [resetEmail, setResetEmail] = useState('');
const [resetSent, setResetSent] = useState(false);
  
  // UI states
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
const [activeTab, setActiveTab] = useState<'dashboard' | 'browse' | 'search' | 'quiz' | 'flashcards' | 'mechanisms' | 'histology' | 'exakinase'>('dashboard'); 
  const [topicTab, setTopicTab] = useState<'all' | 'drug' | 'enzyme' | 'molecule'>('all');
  
  // Navigation states - 3-LEVEL HIERARCHY
const [currentView, setCurrentView] = useState<'chapters' | 'topics' | 'molecules' | 'all-topics'>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // Data states
// Data states
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mechanismTopics, setMechanismTopics] = useState<MechanismTopic[]>([]);
  const [selectedMechanismTopic, setSelectedMechanismTopic] = useState<MechanismTopic | null>(null);
  const [showMechanismModal, setShowMechanismModal] = useState(false);
  const [editingMechanism, setEditingMechanism] = useState<Mechanism | null>(null);
  const [editingMechanismTopic, setEditingMechanismTopic] = useState<MechanismTopic | null>(null);
  const [viewingMechanism, setViewingMechanism] = useState<Mechanism | null>(null);
  
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
  const [currentFlashcardChapter, setCurrentFlashcardChapter] = useState<string | undefined>();
const [flashcardResults, setFlashcardResults] = useState<Array<{
  molecule: any;
  question: string;
  answer: string;
  correct: boolean;
}>>([]);
  
const [showFlashcardConfig, setShowFlashcardConfig] = useState(false);
const [editingFlashcardConfig, setEditingFlashcardConfig] = useState<any>(null);
// Histology states
  const [histologyTopics, setHistologyTopics] = useState<HistologyTopic[]>([]);
  const [selectedHistologyTopic, setSelectedHistologyTopic] = useState<HistologyTopic | null>(null);
  const [editingHistologyTopic, setEditingHistologyTopic] = useState<HistologyTopic | null>(null);
  const [editingHistologySlide, setEditingHistologySlide] = useState<HistologySlide | null>(null);
  const [viewingHistologySlide, setViewingHistologySlide] = useState<HistologySlide | null>(null);
  const [showHistologyModal, setShowHistologyModal] = useState(false);
  // Exakinase states
  const [examCollections, setExamCollections] = useState<ExamCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ExamCollection | null>(null);
  const [editingCollection, setEditingCollection] = useState<ExamCollection | null>(null);
  const [editingHotTopic, setEditingHotTopic] = useState<HotTopic | null>(null);
  const [viewingHotTopic, setViewingHotTopic] = useState<HotTopic | null>(null);
  const [editingExamQuestion, setEditingExamQuestion] = useState<ExamQuestion | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [exakinaseView, setExakinaseView] = useState<'collections' | 'topics' | 'questions'>('collections');
  
useEffect(() => {
  // Capturer le hash AVANT que Supabase le nettoie
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    setShowResetPassword(true);
  }
  checkSession();
}, []);

  useEffect(() => {
    localStorage.setItem('pharmaDarkMode', darkMode.toString());
  }, [darkMode]);
  // Reload histology when entering the tab
  useEffect(() => {
    if (activeTab === 'histology' && user) {
      loadHistologyTopics();
      setSelectedHistologyTopic(null);
    }
  }, [activeTab]);

// Reload mechanisms when entering the tab
  useEffect(() => {
    if (activeTab === 'mechanisms' && user) {
      loadMechanismTopics();
      setSelectedMechanismTopic(null);
    }
  }, [activeTab]);
  // Reload exakinase when entering the tab
  useEffect(() => {
    if (activeTab === 'exakinase' && user) {
      loadExamCollections();
      setSelectedCollection(null);
      setExakinaseView('collections');
    }
  }, [activeTab]);
// Détecter le lien de reset password
  
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
        loadMechanismTopics();
        loadHistologyTopics();
        loadExamCollections();
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
const { data: molecules } = await supabase
  .from('molecules')
  .select('*')
  .eq('topic_id', topic.id)
  .order('created_at', { ascending: true });

const { data: courseNotes } = await supabase
  .from('course_notes')
  .select('*')
  .eq('topic_id', topic.id)
  .order('created_at', { ascending: true });

return { 
  ...topic, 
  molecules: molecules || [],
  course_notes: courseNotes || []
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
// Load mechanism topics
  const loadMechanismTopics = async () => {
    if (!user) return;
    
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('mechanism_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (topicsError) throw topicsError;
      
      const topicsWithMechanisms = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: mechanismsData } = await supabase
            .from('mechanisms')
            .select('*')
            .eq('topic_id', topic.id)
            .order('created_at', { ascending: true });
          
          const mechanismsWithSteps = await Promise.all(
            (mechanismsData || []).map(async (mech) => {
              const { data: steps } = await supabase
                .from('mechanism_steps')
                .select('*')
                .eq('mechanism_id', mech.id)
                .order('step_number');
              
              return { ...mech, steps: steps || [] };
            })
          );
          
          return { ...topic, mechanisms: mechanismsWithSteps };
        })
      );
      
      setMechanismTopics(topicsWithMechanisms);
    } catch (error) {
      console.error('Error loading mechanism topics:', error);
    }
  };

  // Save mechanism topic
  const saveMechanismTopic = async () => {
    if (!user || !editingMechanismTopic?.name?.trim()) {
      alert('Please enter a topic name');
      return;
    }
    
    try {
      if (editingMechanismTopic.id) {
        // Update
        const { error } = await supabase
          .from('mechanism_topics')
          .update({
            name: editingMechanismTopic.name.trim(),
            description: editingMechanismTopic.description || ''
          })
          .eq('id', editingMechanismTopic.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('mechanism_topics')
          .insert([{
            user_id: user.id,
            name: editingMechanismTopic.name.trim(),
            description: editingMechanismTopic.description || ''
          }]);
        
        if (error) throw error;
      }
      
      await loadMechanismTopics();
      setEditingMechanismTopic(null);
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic');
    }
  };

  // Delete mechanism topic
  const deleteMechanismTopic = async (id: string) => {
    if (!confirm('Delete this topic and all its mechanisms?')) return;
    
    try {
      const { error } = await supabase
        .from('mechanism_topics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadMechanismTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // Save mechanism
  const saveMechanism = async () => {
    if (!user || !selectedMechanismTopic) return;
    if (!editingMechanism?.name?.trim()) {
      alert('Please enter a mechanism name');
      return;
    }
    
    try {
      if (editingMechanism.id) {
        // Update existing
        const { error: mechError } = await supabase
          .from('mechanisms')
          .update({
            name: editingMechanism.name.trim(),
            description: editingMechanism.description || '',
            topic_id: selectedMechanismTopic.id
          })
          .eq('id', editingMechanism.id);
        
        if (mechError) throw mechError;
        
        // Delete old steps
        await supabase
          .from('mechanism_steps')
          .delete()
          .eq('mechanism_id', editingMechanism.id);
        
        // Insert new steps
        if (editingMechanism.steps.length > 0) {
          const { error: stepsError } = await supabase
            .from('mechanism_steps')
            .insert(
              editingMechanism.steps.map((step, idx) => ({
                mechanism_id: editingMechanism.id,
                step_number: idx + 1,
                title: step.title || '',
                explanation: step.explanation || '',
                image_url: step.image_url || null
              }))
            );
          
          if (stepsError) throw stepsError;
        }
      } else {
        // Create new
        const { data: newMech, error: mechError } = await supabase
          .from('mechanisms')
          .insert([{
            user_id: user.id,
            name: editingMechanism.name.trim(),
            description: editingMechanism.description || '',
            topic_id: selectedMechanismTopic.id
          }])
          .select()
          .single();
        
        if (mechError) throw mechError;
        
        // Insert steps
        if (editingMechanism.steps.length > 0) {
          const { error: stepsError } = await supabase
            .from('mechanism_steps')
            .insert(
              editingMechanism.steps.map((step, idx) => ({
                mechanism_id: newMech.id,
                step_number: idx + 1,
                title: step.title || '',
                explanation: step.explanation || '',
                image_url: step.image_url || null
              }))
            );
          
          if (stepsError) throw stepsError;
        }
      }
      
      await loadMechanismTopics();
      setShowMechanismModal(false);
      setEditingMechanism(null);
      alert('✅ Mechanism saved!');
    } catch (error) {
      console.error('Error saving mechanism:', error);
      alert('Failed to save mechanism');
    }
  };

  // Delete mechanism
  const deleteMechanism = async (id: string) => {
    if (!confirm('Delete this mechanism?')) return;
    
    try {
      const { error } = await supabase
        .from('mechanisms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadMechanismTopics();
    } catch (error) {
      console.error('Error deleting mechanism:', error);
    }
  };
  
  // Load histology topics
  const loadHistologyTopics = async () => {
    if (!user) return;
    
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('histology_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (topicsError) throw topicsError;
      
      const topicsWithSlides = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: slides, error: slidesError } = await supabase
            .from('histology_slides')
            .select('*')
            .eq('topic_id', topic.id)
            .order('created_at', { ascending: true });
          
          if (slidesError) throw slidesError;
          
          return { ...topic, slides: slides || [] };
        })
      );
      
      setHistologyTopics(topicsWithSlides);
    } catch (error) {
      console.error('Error loading histology:', error);
    }
  };

  // Save histology topic
  const saveHistologyTopic = async () => {
    if (!user || !editingHistologyTopic?.name?.trim()) {
      alert('Please enter a topic name');
      return;
    }
    
    try {
      if (editingHistologyTopic.id) {
        // Update
        const { error } = await supabase
          .from('histology_topics')
          .update({
            name: editingHistologyTopic.name.trim(),
            description: editingHistologyTopic.description || ''
          })
          .eq('id', editingHistologyTopic.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('histology_topics')
          .insert([{
            user_id: user.id,
            name: editingHistologyTopic.name.trim(),
            description: editingHistologyTopic.description || ''
          }]);
        
        if (error) throw error;
      }
      
      await loadHistologyTopics();
      setEditingHistologyTopic(null);
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic');
    }
  };

  // Delete histology topic
  const deleteHistologyTopic = async (id: string) => {
    if (!confirm('Delete this topic and all its slides?')) return;
    
    try {
      const { error } = await supabase
        .from('histology_topics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadHistologyTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // Save histology slide
const saveHistologySlide = async () => {
    if (!selectedHistologyTopic || !editingHistologySlide?.name?.trim()) {
      alert('Please enter a slide name');
      return;
    }
    
    const topicId = selectedHistologyTopic.id;
    
    try {
      const slideData = {
        name: editingHistologySlide.name.trim(),
        image_url: editingHistologySlide.image_url || null,
        explanation: editingHistologySlide.explanation || '',
        magnification: editingHistologySlide.magnification || null,
        staining: editingHistologySlide.staining || null
      };
      
      if (editingHistologySlide.id) {
        // Update
        const { error } = await supabase
          .from('histology_slides')
          .update(slideData)
          .eq('id', editingHistologySlide.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('histology_slides')
          .insert([{
            ...slideData,
            topic_id: topicId
          }]);
        
        if (error) throw error;
      }
      
      await loadHistologyTopics();
      
      // Mettre à jour la référence du topic sélectionné
      const { data: updatedTopicData } = await supabase
        .from('histology_topics')
        .select('*')
        .eq('id', topicId)
        .single();
      
      if (updatedTopicData) {
        const { data: slides } = await supabase
          .from('histology_slides')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: true });
        
        setSelectedHistologyTopic({ ...updatedTopicData, slides: slides || [] });
      }
      
      setShowHistologyModal(false);
      setEditingHistologySlide(null);
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Failed to save slide');
    }
  };

  // Delete histology slide
  const deleteHistologySlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    
    try {
      const { error } = await supabase
        .from('histology_slides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadHistologyTopics();
      setViewingHistologySlide(null);
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  // ========== EXAKINASE FUNCTIONS ==========
  
  // Load exam collections
  const loadExamCollections = async () => {
    if (!user) return;
    
    try {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('exam_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (collectionsError) throw collectionsError;
      
      const collectionsWithData = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          // Load files
          const { data: files } = await supabase
            .from('exam_files')
            .select('*')
            .eq('collection_id', collection.id)
            .order('created_at', { ascending: true });
          
          // Load hot topics
          const { data: topics } = await supabase
            .from('hot_topics')
            .select('*')
            .eq('collection_id', collection.id)
            .order('frequency', { ascending: false });
          
          // Load questions for each topic
          const topicsWithQuestions = await Promise.all(
            (topics || []).map(async (topic) => {
              const { data: questions } = await supabase
                .from('exam_questions')
                .select('*')
                .eq('topic_id', topic.id)
                .order('created_at', { ascending: true });
              
              return { ...topic, questions: questions || [] };
            })
          );
          
          return {
            ...collection,
            files: files || [],
            hot_topics: topicsWithQuestions
          };
        })
      );
      
      setExamCollections(collectionsWithData);
    } catch (error) {
      console.error('Error loading exam collections:', error);
    }
  };

  // Save exam collection
  const saveExamCollection = async () => {
    if (!user || !editingCollection?.name?.trim()) {
      alert('Please enter a collection name');
      return;
    }
    
    try {
      if (editingCollection.id) {
        // Update
        const { error } = await supabase
          .from('exam_collections')
          .update({
            name: editingCollection.name.trim(),
            description: editingCollection.description || '',
            subject: editingCollection.subject || '',
            year: editingCollection.year || ''
          })
          .eq('id', editingCollection.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('exam_collections')
          .insert([{
            user_id: user.id,
            name: editingCollection.name.trim(),
            description: editingCollection.description || '',
            subject: editingCollection.subject || '',
            year: editingCollection.year || ''
          }]);
        
        if (error) throw error;
      }
      
      await loadExamCollections();
      setEditingCollection(null);
      alert('✅ Collection saved!');
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection');
    }
  };

  // Delete exam collection
  const deleteExamCollection = async (id: string) => {
    if (!confirm('Delete this collection and all its data?')) return;
    
    try {
      const { error } = await supabase
        .from('exam_collections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadExamCollections();
      setSelectedCollection(null);
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  // Upload exam file (PDF)
  const uploadExamFile = async (file: File, fileType: 'exam' | 'course', year?: string) => {
    if (!user || !selectedCollection) return;
    
    setUploadingFile(true);
    
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedCollection.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exam-files')
        .getPublicUrl(fileName);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('exam_files')
        .insert([{
          collection_id: selectedCollection.id,
          name: file.name,
          file_url: publicUrl,
          file_type: fileType,
          year: year || null,
          processed: false
        }]);
      
      if (dbError) throw dbError;
      
      await loadExamCollections();
      alert('✅ File uploaded! Processing...');
      
      // TODO: Trigger AI processing here
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Save hot topic
  const saveHotTopic = async () => {
    if (!selectedCollection || !editingHotTopic?.title?.trim()) {
      alert('Please enter a topic title');
      return;
    }
    
    try {
      const topicData = {
        title: editingHotTopic.title.trim(),
        description: editingHotTopic.description || '',
        image_url: editingHotTopic.image_url || null,
        slide_number: editingHotTopic.slide_number || null,
        frequency: editingHotTopic.frequency || 1,
        exam_years: editingHotTopic.exam_years || [],
        priority: editingHotTopic.priority || 'MEDIUM',
        question_types: editingHotTopic.question_types || []
      };
      
      if (editingHotTopic.id) {
        // Update
        const { error } = await supabase
          .from('hot_topics')
          .update(topicData)
          .eq('id', editingHotTopic.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('hot_topics')
          .insert([{
            ...topicData,
            collection_id: selectedCollection.id
          }]);
        
        if (error) throw error;
      }
      
      await loadExamCollections();
      setShowExamModal(false);
      setEditingHotTopic(null);
      alert('✅ Hot Topic saved!');
    } catch (error) {
      console.error('Error saving hot topic:', error);
      alert('Failed to save hot topic');
    }
  };

  // Delete hot topic
  const deleteHotTopic = async (id: string) => {
    if (!confirm('Delete this hot topic?')) return;
    
    try {
      const { error } = await supabase
        .from('hot_topics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadExamCollections();
      setViewingHotTopic(null);
    } catch (error) {
      console.error('Error deleting hot topic:', error);
    }
  };

  // Save exam question
  const saveExamQuestion = async () => {
    if (!selectedCollection || !editingExamQuestion?.question?.trim()) {
      alert('Please enter a question');
      return;
    }
    
    try {
      const questionData = {
        question: editingExamQuestion.question.trim(),
        answer: editingExamQuestion.answer || '',
        explanation: editingExamQuestion.explanation || '',
        difficulty: editingExamQuestion.difficulty || 'MEDIUM',
        question_type: editingExamQuestion.question_type || 'QCM',
        options: editingExamQuestion.options || [],
        correct_option: editingExamQuestion.correct_option || null,
        source_year: editingExamQuestion.source_year || null,
        is_ai_generated: editingExamQuestion.is_ai_generated || false
      };
      
      if (editingExamQuestion.id) {
        // Update
        const { error } = await supabase
          .from('exam_questions')
          .update(questionData)
          .eq('id', editingExamQuestion.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('exam_questions')
          .insert([{
            ...questionData,
            collection_id: selectedCollection.id,
            topic_id: editingExamQuestion.topic_id || null
          }]);
        
        if (error) throw error;
      }
      
      await loadExamCollections();
      setShowExamModal(false);
      setEditingExamQuestion(null);
      alert('✅ Question saved!');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    }
  };

  // Delete exam question
  const deleteExamQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadExamCollections();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  // Process with AI (Phase 2/3 - Placeholder for now)
  const processWithAI = async (collectionId: string) => {
    if (!user) return;
    
    setProcessingAI(true);
    
    try {
      // TODO: Implement AI analysis
      // 1. Get all exam files and course files
      // 2. Extract text from PDFs
      // 3. Compare and find patterns
      // 4. Generate hot topics
      // 5. Generate questions
      
      alert('🤖 AI Processing will be implemented in Phase 2!');
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      alert('Failed to process with AI');
    } finally {
      setProcessingAI(false);
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
  const handlePasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!resetEmail.trim()) {
    alert('Please enter your email');
    return;
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}`,
    });
    
    if (error) throw error;
    
    setResetSent(true);
    setTimeout(() => {
      setshowResetPassword(false);
      setResetEmail('');
      setResetSent(false);
    }, 3000);
  } catch (error: any) {
    console.error('Password reset error:', error);
    alert(error.message || 'Failed to send reset email');
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

      const newTopic = { ...data, molecules: [], course_notes: [] };
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
    
    // Créer directement l'objet avec le bon type selon l'onglet actif
    setEditingMolecule({
      id: '',
      topic_id: selectedTopic?.id || '',
      name: '',
      smiles: '',
      formula: '',
      description: '',
      image_url: '',
      molecule_type: topicTab === 'course' ? 'course' : 'drug',
      use_in_flashcards: topicTab !== 'course'
    });
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
    
    // Déterminer la table en fonction de l'onglet actif
    const tableName = topicTab === 'course' ? 'course_notes' : 'molecules';
    
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
  side_effects: editingMolecule.side_effects || null,
  use_in_flashcards: editingMolecule.use_in_flashcards !== false
    };

      if (editingMolecule.id) {
        // UPDATE
        const { error } = await supabase
          .from(tableName)
          .update(moleculeData)
          .eq('id', editingMolecule.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        const updatedMolecule = { ...editingMolecule, ...moleculeData };
        const updatedTopic = {
          ...selectedTopic,
          molecules: topicTab === 'course' ? selectedTopic.molecules : selectedTopic.molecules.map(m =>
            m.id === editingMolecule.id ? updatedMolecule : m
          ),
          course_notes: topicTab === 'course' ? selectedTopic.course_notes.map(m =>
            m.id === editingMolecule.id ? updatedMolecule : m
          ) : selectedTopic.course_notes
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
const insertData = tableName === 'course_notes' 
  ? {
      ...moleculeData,
      topic_id: selectedTopic.id,
      user_id: user?.id
    }
  : {
      ...moleculeData,
      topic_id: selectedTopic.id
    };

const { data, error } = await supabase
  .from(tableName)
  .insert([insertData])
        
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        const newMolecule = data;
        const updatedTopic = {
          ...selectedTopic,
          molecules: topicTab === 'course' ? selectedTopic.molecules : [...selectedTopic.molecules, newMolecule],
          course_notes: topicTab === 'course' ? [...selectedTopic.course_notes, newMolecule] : selectedTopic.course_notes
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
setWizardStep('name');      
      alert('✅ Saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    }
  };
const deleteMolecule = async (id: string) => {
  if (!selectedChapter || !selectedTopic) return;
  
  // Déterminer la table selon l'onglet actif
  const tableName = topicTab === 'course' ? 'course_notes' : 'molecules';
  
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Mettre à jour l'état local
    const updatedTopic = {
      ...selectedTopic,
      molecules: topicTab === 'course' ? selectedTopic.molecules : selectedTopic.molecules.filter(m => m.id !== id),
      course_notes: topicTab === 'course' ? selectedTopic.course_notes.filter(m => m.id !== id) : selectedTopic.course_notes
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
    
    alert('✅ Deleted successfully!');
  } catch (error) {
    console.error('Error deleting:', error);
    alert('Failed to delete. Please try again.');
  }
};
  
  // Quiz functions
const generateQuiz = (chapterId?: string) => {
  let allMolecules;
  
  if (chapterId) {
    // Quiz pour un chapitre spécifique
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    allMolecules = chapter.topics.flatMap(t => t.molecules).filter(m => m.image_url);
  } else {
    // Quiz pour tous les chapitres
    allMolecules = chapters.flatMap(c => 
      c.topics.flatMap(t => t.molecules)
    ).filter(m => m.image_url);
  }
  
  if (allMolecules.length < 4) {
    alert('Vous avez besoin d\'au moins 4 molécules avec images pour générer un quiz !');
    return;
  }
  
  const questions: QuizQuestion[] = [];
  const usedMolecules = new Set<string>();
  const numQuestions = Math.min(10, allMolecules.length);
  
  for (let i = 0; i < numQuestions; i++) {
    let correctMolecule;
    do {
      correctMolecule = allMolecules[Math.floor(Math.random() * allMolecules.length)];
    } while (usedMolecules.has(correctMolecule.id));
    
    usedMolecules.add(correctMolecule.id);
    
    // Choisir 3 autres molécules différentes
    const wrongMolecules = [];
    const availableWrong = allMolecules.filter(m => m.id !== correctMolecule.id);
    
    while (wrongMolecules.length < 3 && availableWrong.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWrong.length);
      const wrongMol = availableWrong[randomIndex];
      
      if (!wrongMolecules.find(m => m.id === wrongMol.id)) {
        wrongMolecules.push(wrongMol);
      }
      availableWrong.splice(randomIndex, 1);
    }
    
    // Mélanger les 4 molécules (1 correcte + 3 fausses)
    const allOptions = [correctMolecule, ...wrongMolecules].sort(() => Math.random() - 0.5);
    
    questions.push({
      question: `Quelle est la structure de ${correctMolecule.name} ?`,
      options: allOptions.map(m => m.image_url || ''),
      correctAnswer: allOptions.findIndex(m => m.id === correctMolecule.id),
      explanation: `Ceci est la structure de ${correctMolecule.name}. ${correctMolecule.primary_function || ''}`
    });
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
  setCurrentFlashcardChapter(chapterId); 
  let allQuestions: any[] = [];
  
  const chaptersToUse = chapterId 
    ? chapters.filter(c => c.id === chapterId)
    : chapters;
  
  chaptersToUse.forEach(chapter => {
    chapter.topics.forEach(topic => {
      // Obtenir la config des questions pour ce topic
      const config = topic.flashcard_config?.question_types || [];
      const enabledQuestions = config.filter((q: any) => q.enabled);
      
      if (enabledQuestions.length === 0) {
        // Config par défaut: image → nom
topic.molecules
  .filter(m => m.use_in_flashcards !== false)
          .forEach(m => {
            allQuestions.push({
              type: 'image_to_name',
              molecule: m,
              question: 'Quelle est cette molécule?',
              answer: m.name,
              hasImage: true
            });
          });
      } else {
        // Utiliser la config personnalisée
        topic.molecules
          .filter(m => m.use_in_flashcards !== false)
          .forEach(molecule => {
            enabledQuestions.forEach((q: any) => {
                // Question avec image (si disponible)
                if (q.type === 'image_to_name' && molecule.image_url) {
                  allQuestions.push({
                    type: 'image_to_name',
                    molecule,
                    question: q.label,
                    answer: molecule.name,
                    hasImage: true
                  });
                }
                // Question texte → texte
                if (q.type === 'name_to_field' && q.field && molecule[q.field]) {
                  allQuestions.push({
              
                  type: 'name_to_field',
                  molecule,
                  question: `${molecule.name} - ${q.label}`,
                  answer: molecule[q.field],
                  hasImage: false
                });
              }
            });
          });
      }
    });
  });
  
  if (allQuestions.length === 0) {
    alert('No flashcards available! Configure questions for your topics.');
    return;
  }
  
console.log('🎴 Total questions:', allQuestions.length);
console.log('📊 Détails:', allQuestions.map(q => ({
  nom: q.molecule.name,
  type: q.type,
  hasImage: q.hasImage,
  image: q.molecule.image_url ? 'OUI' : 'NON'
})));
const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  
  setFlashcards(shuffled);
  setCurrentFlashcardIndex(0);
  setShowFlashcardAnswer(false);
  setFlashcardStats({ correct: 0, wrong: 0 });
  setFlashcardMode(true);
  setFlashcardResults([]);
};

const revealFlashcardAnswer = () => {
  setShowFlashcardAnswer(true);
};

const markCorrect = () => {
  setFlashcardStats(prev => ({ ...prev, correct: prev.correct + 1 }));
  setFlashcardResults(prev => [...prev, {
    molecule: flashcards[currentFlashcardIndex].molecule,
    question: flashcards[currentFlashcardIndex].question,
    answer: flashcards[currentFlashcardIndex].answer,
    correct: true
  }]);
  nextFlashcard();
};

const markWrong = () => {
  setFlashcardStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
  setFlashcardResults(prev => [...prev, {
    molecule: flashcards[currentFlashcardIndex].molecule,
    question: flashcards[currentFlashcardIndex].question,
    answer: flashcards[currentFlashcardIndex].answer,
    correct: false
  }]);
  nextFlashcard();
};

const nextFlashcard = () => {
  setCurrentFlashcardIndex(prev => prev + 1);
  setShowFlashcardAnswer(false);
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
.filter(mol => {
  const query = searchQuery.toLowerCase();
  return (
    mol.name.toLowerCase().includes(query) ||
    mol.formula.toLowerCase().includes(query) ||
    (mol.description || '').toLowerCase().includes(query) ||
    (mol.primary_function || '').toLowerCase().includes(query) ||
    (mol.side_effects || '').toLowerCase().includes(query) ||
    (mol.drug_category || '').toLowerCase().includes(query) ||
    (mol.drug_class || '').toLowerCase().includes(query) ||
    (mol.target_receptor || '').toLowerCase().includes(query)
  );
})
      
        .map(mol => ({ chapter, topic, molecule: mol }))
    )
  );

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <FlaskConical className="w-16 h-16 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading PharmaKinase Pro...</p>
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
              PharmaKinase
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-Powered Molecular Learning
            </p>
          </div>
{window.location.hash.includes('type=recovery') ? (
  <div className="space-y-4">
    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Reset Password</h2>
    <input
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
      placeholder="New password"
    />
    <button
      onClick={async () => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) alert('Error: ' + error.message);
        else { alert('✅ Password updated!'); setShowResetPassword(false); setNewPassword(''); }
      }}
      className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-lg"
    >
      Update Password
    </button>
    <button
      onClick={() => setShowResetPassword(false)}
      className={`w-full py-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
    >
      Back to Login
    </button>
  </div>
) : (
          
            <>
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
            
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
className={`w-full mt-3 text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}     
                >
                Forgot your password?
              </button>
            )}
          </form>
              </>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          
<p className={`mt-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            A little idea of A.Minaei ✨
          </p>
        </div>
        
        {/* PASSWORD RESET MODAL */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Reset Password
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enter your email to receive a password reset link
                </p>
              </div>

              {resetSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Email Sent!
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Check your inbox for the password reset link
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500'
                      } focus:outline-none`}
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Send Reset Link
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setshowResetPassword(false);
                      setResetEmail('');
                    }}
                    className={`w-full py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all`}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main App Interface
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
{/* RESET PASSWORD MODAL */}
    {showResetPassword && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-md w-full`}>
          <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
          <input
            type="password"
            placeholder="New password"
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border-2 mb-4 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
          />
          <button
            onClick={async () => {
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) alert('Error: ' + error.message);
              else { 
                alert('✅ Password updated!'); 
                window.location.hash = '';
                window.location.reload();
              }
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-lg"
          >
            Update Password
          </button>
        </div>
      </div>
    )}
      
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
                <span className="font-bold text-xl hidden sm:block">PharmaKinase</span>
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
  onClick={() => {
    setActiveTab('dashboard');
    setSidebarOpen(false);
  }}
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
onClick={() => { 
  setActiveTab('browse'); 
  goToChapters(); 
  setSidebarOpen(false);
}}
              
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
onClick={() => {
  setActiveTab('search');
  setSidebarOpen(false);
}}
              
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
onClick={() => {
  setActiveTab('quiz');
  setSidebarOpen(false);
}}  
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
onClick={() => {
  setActiveTab('flashcards');
  setSidebarOpen(false);
}}
              
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Flashcards</span>
            </button> 
          <button
onClick={() => {
  setActiveTab('mechanisms');
  setSidebarOpen(false);
}}
            
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'mechanisms'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              <span className="font-medium">Mechanisms</span>
            </button> 
            
          <button
onClick={() => {
  setActiveTab('histology');
  setSelectedHistologyTopic(null);
  setSidebarOpen(false);
}}
            
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'histology'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Maximize2 className="w-5 h-5" />
              <span className="font-medium">Histology</span>
            </button>
{/* EXAKINASE - HIDDEN FOR NOW
            <button
              onClick={() => setActiveTab('exakinase')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'exakinase'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="font-medium">Exakinase</span>
            </button>
            */}
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
<div 
  onClick={() => {
    setActiveTab('browse');
    goToChapters();
  }}
  className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 shadow-lg cursor-pointer transition-all`}
>
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

<div 
  onClick={() => {
    setActiveTab('browse');
    setCurrentView('all-topics');
  }}
  className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 shadow-lg cursor-pointer transition-all`}
>
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
      } else if (currentView === 'all-topics') {
        setActiveTab('dashboard');
        setCurrentView('chapters');
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

              {/* ALL TOPICS VIEW */}
      {currentView === 'all-topics' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">All Topics</h1>
          </div>

          {chapters.map(chapter => (
            <div key={chapter.id} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                📚 {chapter.name}
                <span className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({chapter.topics.length} topics)
                </span>
              </h2>

              {chapter.topics.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} ml-6`}>No topics yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chapter.topics.map(topic => (
                    <div
                      key={topic.id}
                      className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 transition-all cursor-pointer border-2 border-transparent hover:border-green-500`}
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setSelectedTopic(topic);
                        setCurrentView('molecules');
                      }}
                    >
                      <h3 className="text-xl font-bold mb-3">🧬 {topic.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {topic.molecules.length} molecules
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold">🧬 {topic.name}</h3>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFlashcardConfig(topic);
                                    setShowFlashcardConfig(true);
                                  }}
                                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                  title="Configure Flashcards"
                                >
                                  ⚙️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTopic(topic);
                                  }}
                                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                  title="Edit name"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
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
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
<button
            onClick={() => setTopicTab('course')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              topicTab === 'course'
                ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📚 Cours ({selectedTopic.course_notes.length})
          </button>
        </div>
              {(topicTab === 'course' ? (selectedTopic.course_notes || []).length === 0 : selectedTopic.molecules.length === 0) ? (

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
{(topicTab === 'course' ? (selectedTopic.course_notes || []) : selectedTopic.molecules)
  .filter(molecule => {
    if (topicTab === 'course') return true;
    if (topicTab === 'all') return true;
    return molecule.molecule_type === topicTab;
  })
                      
  .map(molecule => (
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
                      ))}
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
      <div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 text-center mb-6`}>
          <Brain className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className="text-2xl font-bold mb-4">Test Your Knowledge!</h3>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a chapter to start your quiz
          </p>
        </div>

        {/* SÉLECTION DES CHAPITRES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Option: Tous les chapitres */}
          <div
            onClick={() => generateQuiz()}
            className={`${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-500' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400'} border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-xl`}
          >
            <Sparkles className="w-12 h-12 text-purple-500 mb-3" />
            <h3 className="text-xl font-bold mb-2">🌟 All Chapters</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Quiz from all your molecules
            </p>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {chapters.flatMap(c => c.topics.flatMap(t => t.molecules)).filter(m => m.image_url).length} molecules
            </p>
          </div>

          {/* Liste des chapitres */}
          {chapters.map(chapter => {
            const moleculesWithImages = chapter.topics.flatMap(t => t.molecules).filter(m => m.image_url).length;
            
            if (moleculesWithImages < 4) return null;
            
            return (
              <div
                key={chapter.id}
                onClick={() => generateQuiz(chapter.id)}
                className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 hover:border-blue-500' : 'bg-white hover:shadow-xl border-gray-200 hover:border-blue-400'} border-2 rounded-xl p-6 cursor-pointer transition-all`}
              >
                <BookOpen className="w-12 h-12 text-blue-500 mb-3" />
                <h3 className="text-xl font-bold mb-2">{chapter.name}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {chapter.topics.length} topics
                </p>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {moleculesWithImages} molecules available
                </p>
              </div>
            );
          })}
        </div>

        {chapters.flatMap(c => c.topics.flatMap(t => t.molecules)).filter(m => m.image_url).length < 4 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center mt-6`}>
            <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-xl font-bold mb-2">Not enough molecules</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add at least 4 molecules with images to create a quiz!
            </p>
          </div>
        )}
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
onClick={() => {
  setQuizActive(false);
  setQuizQuestions([]);
  setCurrentQuestionIndex(0);
  setSelectedAnswer(null);
  setShowQuizResult(false);
}}
                      
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
  <button
    onClick={() => {
      if (confirm('Voulez-vous vraiment quitter ce quiz?')) {
        setQuizActive(false);
        setQuizQuestions([]);
      }
    }}
    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
  >
    Quitter le quiz
  </button>
                      
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

                  <div className="grid grid-cols-2 gap-4 mb-6">
  {quizQuestions[currentQuestionIndex].options.map((imageUrl, index) => (
    <button
      key={index}
      onClick={() => !showQuizResult && handleQuizAnswer(index)}
      disabled={showQuizResult}
      className={`relative p-4 rounded-xl border-4 transition-all ${
        showQuizResult
          ? index === quizQuestions[currentQuestionIndex].correctAnswer
            ? 'border-green-500 bg-green-100 dark:bg-green-900'
            : index === selectedAnswer
            ? 'border-red-500 bg-red-100 dark:bg-red-900'
            : 'border-gray-300 dark:border-gray-600'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      <div className="bg-white rounded-lg p-3 mb-2">
        <img 
          src={imageUrl} 
          alt={`Option ${index + 1}`}
          className="w-full h-40 object-contain"
        />
      </div>
      
      {showQuizResult && (
        <div className="absolute top-2 right-2">
          {index === quizQuestions[currentQuestionIndex].correctAnswer ? (
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          ) : index === selectedAnswer ? (
            <div className="bg-red-500 rounded-full p-2">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          ) : null}
        </div>
      )}
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
  const moleculesWithImages = chapter.topics.flatMap(t => t.molecules).filter(m => m.use_in_flashcards !== false).length;
  
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
  {moleculesWithImages} molecules
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
                      <button
                        onClick={() => {
                          if (confirm('Quitter les flashcards?')) {
                            setFlashcardMode(false);
                            setFlashcards([]);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        ❌ Quit
                      </button>
                  
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
  {flashcards[currentFlashcardIndex].hasImage ? (
    <img 
      src={flashcards[currentFlashcardIndex].molecule.image_url} 
      alt="Guess this molecule"
      className="max-h-64 object-contain"
    />
  ) : (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">
        {flashcards[currentFlashcardIndex].molecule.name}
      </h2>
      <p className="text-xl text-gray-600">
        {flashcards[currentFlashcardIndex].question.split(' - ')[1]}
      </p>
    </div>
  )}
</div>

{!showFlashcardAnswer ? (
  <div>
    <h3 className="text-xl font-bold mb-4 text-center">{flashcards[currentFlashcardIndex].question}</h3>
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
                        <h3 className="text-2xl font-bold mb-4">✅ {flashcards[currentFlashcardIndex].answer}</h3>
                        
                        {flashcards[currentFlashcardIndex].molecule.formula && (
                          <p className={`text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Formula:</strong> {flashcards[currentFlashcardIndex].molecule.formula}
                          </p>
                        )}

                        {flashcards[currentFlashcardIndex].molecule.drug_category && (
                          <p className="mb-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {flashcards[currentFlashcardIndex].molecule.drug_category}
                            </span>
                          </p>
                        )}

                        {flashcards[currentFlashcardIndex].molecule.primary_function && (
                          <div className="mt-4">
                            <strong className="block mb-2">🎯 Primary Function:</strong>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {flashcards[currentFlashcardIndex].molecule.primary_function}
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
  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 max-w-6xl mx-auto`}>
    {/* Header avec score */}
    <div className="text-center mb-8">
      <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
        flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong) >= 0.7 
          ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
          : flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong) >= 0.5
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
          : 'bg-gradient-to-br from-red-400 to-pink-500'
      } shadow-xl`}>
        <span className="text-5xl font-bold text-white">
          {Math.round((flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong)) * 100)}%
        </span>
      </div>
      <h2 className="text-4xl font-bold mb-4">
        {flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong) >= 0.7 
          ? '🎉 Excellent!' 
          : flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong) >= 0.5
          ? '👍 Pas mal!'
          : '💪 Continue!'}
      </h2>
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">{flashcardStats.correct}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Correctes</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-500">{flashcardStats.wrong}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>À revoir</div>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div className="max-w-md mx-auto">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all"
            style={{ width: `${(flashcardStats.correct / (flashcardStats.correct + flashcardStats.wrong)) * 100}%` }}
          />
        </div>
      </div>
    </div>

    {/* Molécules à revoir */}
    {flashcardResults.filter(r => !r.correct).length > 0 && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-red-500">❌ À Revoir ({flashcardResults.filter(r => !r.correct).length})</h3>
          <button
            onClick={() => {
              const wrongQuestions = flashcardResults
                .filter(r => !r.correct)
                .map(r => ({
                  type: r.correct ? 'image_to_name' : 'name_to_field',
                  molecule: r.molecule,
                  question: r.question,
                  answer: r.answer,
                  hasImage: false
                }));
              
              const shuffled = [...wrongQuestions].sort(() => Math.random() - 0.5);
              setFlashcards(shuffled);
              setCurrentFlashcardIndex(0);
              setShowFlashcardAnswer(false);
              setFlashcardStats({ correct: 0, wrong: 0 });
              setFlashcardResults([]);
              setFlashcardMode(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            🔄 Revoir ces cartes
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcardResults.filter(r => !r.correct).map((result, idx) => (
            <div key={idx} className={`${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-lg">{result.molecule.name}</h4>
                <span className="text-2xl">❌</span>
              </div>
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.question}</p>
              <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                <p className="text-sm font-medium">Réponse: {result.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Molécules maîtrisées */}
    {flashcardResults.filter(r => r.correct).length > 0 && (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-green-500 mb-4">✅ Maîtrisées ({flashcardResults.filter(r => r.correct).length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {flashcardResults.filter(r => r.correct).map((result, idx) => (
            <div key={idx} className={`${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border-2 rounded-lg p-3 text-center`}>
              <span className="text-xl mb-1">✅</span>
              <p className="font-medium text-sm">{result.molecule.name}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Boutons d'action */}
    <div className="flex gap-4 justify-center">
      <button
        onClick={() => {
          setFlashcardMode(false);
          setFlashcards([]);
          setFlashcardResults([]);
        }}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
      >
        🏠 Retour
      </button>
      <button
        onClick={() => startFlashcards(currentFlashcardChapter)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
      >
        <PlayCircle className="w-5 h-5" />
        Recommencer
      </button>
    </div>
  </div>
)}
  </div>
 )}
  
{/* MECHANISMS VIEW */}
          {activeTab === 'mechanisms' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">🧬 Chemical Mechanisms</h1>
                {!selectedMechanismTopic && (
                  <button
                    onClick={() => {
                      setEditingMechanismTopic({
                        id: '',
                        user_id: user?.id || '',
                        name: '',
                        description: '',
                        mechanisms: []
                      });
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Topic
                  </button>
                )}
              </div>

              {/* TOPICS LIST */}
              {!selectedMechanismTopic ? (
                <div>
                  {mechanismTopics.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <FlaskConical className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No mechanism topics yet</h3>
                      <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create your first topic to organize mechanisms!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mechanismTopics.map(topic => (
                        <div
                          key={topic.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 cursor-pointer transition-all border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-200 hover:border-purple-400'}`}
                          onClick={() => setSelectedMechanismTopic(topic)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold">{topic.name}</h3>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingMechanismTopic(topic)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMechanismTopic(topic.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {topic.description && (
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {topic.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                              {topic.mechanisms.length} mechanisms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* MECHANISMS LIST */
                <div>
                  <button
                    onClick={() => setSelectedMechanismTopic(null)}
                    className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                    } transition-colors shadow`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Topics</span>
                  </button>

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{selectedMechanismTopic.name}</h2>
                    <button
                      onClick={() => {
                        setEditingMechanism({
                          id: '',
                          user_id: user?.id || '',
                          topic_id: selectedMechanismTopic.id,
                          name: '',
                          description: '',
                          steps: [{
                            id: '',
                            mechanism_id: '',
                            step_number: 1,
                            title: '',
                            explanation: '',
                            image_url: ''
                          }]
                        });
                        setShowMechanismModal(true);
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Mechanism
                    </button>
                  </div>

                  {selectedMechanismTopic.mechanisms.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <h3 className="text-xl font-bold mb-2">No mechanisms yet</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add your first mechanism to this topic!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedMechanismTopic.mechanisms.map(mechanism => (
                        <div
                          key={mechanism.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 cursor-pointer transition-all border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-200 hover:border-purple-400'}`}
                          onClick={() => setViewingMechanism(mechanism)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold">{mechanism.name}</h3>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingMechanism(mechanism);
                                  setShowMechanismModal(true);
                                }}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMechanism(mechanism.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {mechanism.description && (
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {mechanism.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                              {mechanism.steps.length} steps
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
{/* HISTOLOGY VIEW */}
          {activeTab === 'histology' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">🔬 Histology</h1>
                {!selectedHistologyTopic && (
                  <button
                    onClick={() => {
                      setEditingHistologyTopic({
                        id: '',
                        user_id: user?.id || '',
                        name: '',
                        description: '',
                        slides: []
                      });
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Topic
                  </button>
                )}
              </div>

              {/* TOPICS LIST */}
              {!selectedHistologyTopic ? (
                <div>
                  {histologyTopics.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <Maximize2 className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No histology topics yet</h3>
                      <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create your first histology topic!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {histologyTopics.map(topic => (
                        <div
                          key={topic.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 cursor-pointer transition-all border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-200 hover:border-purple-400'}`}
                          onClick={() => setSelectedHistologyTopic(topic)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold">{topic.name}</h3>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingHistologyTopic(topic)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteHistologyTopic(topic.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {topic.description && (
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {topic.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                              {topic.slides.length} slides
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* SLIDES LIST */
                <div>
                  <button
                    onClick={() => setSelectedHistologyTopic(null)}
                    className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                    } transition-colors shadow`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Topics</span>
                  </button>

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{selectedHistologyTopic.name}</h2>
                    <button
                      onClick={() => {
                        setEditingHistologySlide({
                          id: '',
                          topic_id: selectedHistologyTopic.id,
                          name: '',
                          explanation: '',
                          image_url: '',
                          magnification: '',
                          staining: ''
                        });
                        setShowHistologyModal(true);
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Slide
                    </button>
                  </div>

                  {selectedHistologyTopic.slides.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <h3 className="text-xl font-bold mb-2">No slides yet</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add your first histology slide!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedHistologyTopic.slides.map(slide => (
                        <div
                          key={slide.id}
                          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 transition-all hover:shadow-xl border-2 border-transparent hover:border-blue-500 cursor-pointer`}
                          onClick={() => setViewingHistologySlide(slide)}
                        >
                          {slide.image_url && (
                            <div className="relative mb-3 bg-white rounded-lg p-2">
                              <img 
                                src={slide.image_url} 
                                alt={slide.name}
                                className="w-full h-48 object-cover rounded"
                              />
                            </div>
                          )}
                          
                          <h4 className="font-bold mb-2">{slide.name}</h4>
                          
                          {slide.staining && (
                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              🎨 {slide.staining}
                            </p>
                          )}
                          
                          {slide.magnification && (
                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              🔍 {slide.magnification}
                            </p>
                          )}
                          
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} line-clamp-2`}>
                            {slide.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
{/* EXAKINASE VIEW */}
          {activeTab === 'exakinase' && (
            <div>
              {/* COLLECTIONS VIEW */}
              {exakinaseView === 'collections' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold">🧠 Exakinase</h1>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Smart Exam Analyzer - Find patterns in past exams
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCollection({
                          id: '',
                          user_id: user?.id || '',
                          name: '',
                          description: '',
                          subject: '',
                          year: ''
                        });
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      New Collection
                    </button>
                  </div>

                  {examCollections.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <Brain className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className="text-xl font-bold mb-2">No collections yet</h3>
                      <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create your first exam collection to start analyzing patterns!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {examCollections.map(collection => (
                        <div
                          key={collection.id}
                          className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-xl'} rounded-xl p-6 cursor-pointer transition-all border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-200 hover:border-purple-400'}`}
                          onClick={() => {
                            setSelectedCollection(collection);
                            setExakinaseView('topics');
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-1">{collection.name}</h3>
                              {collection.subject && (
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {collection.subject} {collection.year && `• ${collection.year}`}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingCollection(collection)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteExamCollection(collection.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {collection.description && (
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {collection.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                              📄 {collection.files?.length || 0} files
                            </span>
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                              🔥 {collection.hot_topics?.length || 0} topics
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HOT TOPICS VIEW */}
              {exakinaseView === 'topics' && selectedCollection && (
                <div>
                  <button
                    onClick={() => {
                      setExakinaseView('collections');
                      setSelectedCollection(null);
                    }}
                    className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                    } transition-colors shadow`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Collections</span>
                  </button>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCollection.name}</h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedCollection.hot_topics?.length || 0} hot topics identified
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingHotTopic({
                            id: '',
                            collection_id: selectedCollection.id,
                            title: '',
                            description: '',
                            frequency: 1,
                            exam_years: [],
                            priority: 'MEDIUM',
                            question_types: []
                          });
                          setShowExamModal(true);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        Add Hot Topic
                      </button>
                      <button
                        onClick={() => {
                          // TODO: File upload modal
                          alert('File upload coming soon!');
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                      >
                        <Upload className="w-5 h-5" />
                        Upload Files
                      </button>
                    </div>
                  </div>

                  {/* Files Section */}
                  {selectedCollection.files && selectedCollection.files.length > 0 && (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mb-6`}>
                      <h3 className="text-lg font-bold mb-4">📄 Uploaded Files</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedCollection.files.map(file => (
                          <div
                            key={file.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                file.file_type === 'exam' ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                <BookOpen className={`w-4 h-4 ${
                                  file.file_type === 'exam' ? 'text-red-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {file.file_type === 'exam' ? '📝 Exam' : '📚 Course'} {file.year && `• ${file.year}`}
                                </p>
                              </div>
                            </div>
                            {file.processed && (
                              <span className="text-xs text-green-600">✓ Processed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hot Topics Grid */}
                  {!selectedCollection.hot_topics || selectedCollection.hot_topics.length === 0 ? (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
                      <h3 className="text-xl font-bold mb-2">No hot topics yet</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add hot topics manually or upload files to auto-detect patterns!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {selectedCollection.hot_topics.map(topic => (
                        <div
                          key={topic.id}
                          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 transition-all hover:shadow-xl border-2 cursor-pointer ${
                            topic.priority === 'HIGH'
                              ? 'border-red-500'
                              : topic.priority === 'MEDIUM'
                              ? 'border-yellow-500'
                              : 'border-gray-300'
                          }`}
                          onClick={() => setViewingHotTopic(topic)}
                        >
                          {topic.image_url && (
                            <div className="relative mb-3 bg-white rounded-lg p-2">
                              <img 
                                src={topic.image_url} 
                                alt={topic.title}
                                className="w-full h-32 object-contain"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold flex-1">{topic.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              topic.priority === 'HIGH'
                                ? 'bg-red-100 text-red-700'
                                : topic.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {topic.priority}
                            </span>
                          </div>
                          
                          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            📊 Appeared {topic.frequency} time{topic.frequency > 1 ? 's' : ''}
                          </p>
                          
                          {topic.exam_years && topic.exam_years.length > 0 && (
                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              📅 {topic.exam_years.join(', ')}
                            </p>
                          )}
                          
                          {topic.slide_number && (
                            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              📍 Slide {topic.slide_number}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
        </main>
      </div>

          {/* MECHANISM DETAIL MODAL */}
          {viewingMechanism && !showMechanismModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">{viewingMechanism.name}</h2>
                  <button
                    onClick={() => setViewingMechanism(null)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {viewingMechanism.description && (
                    <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {viewingMechanism.description}
                    </p>
                  )}

                  <div className="space-y-6">
                    {viewingMechanism.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-xl p-6 border-l-4 border-purple-500`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            {step.title && (
                              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                            )}
                            {step.explanation && (
                              <p className={`mb-4 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {step.explanation}
                              </p>
                            )}
                            {step.image_url && (
                              <div className="bg-white rounded-lg p-4">
                                <img 
                                  src={step.image_url} 
                                  alt={`Step ${idx + 1}`}
                                  className="max-h-64 mx-auto object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MECHANISM EDIT MODAL */}
          {showMechanismModal && editingMechanism && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">
                    {editingMechanism.id ? 'Edit Mechanism' : 'New Mechanism'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowMechanismModal(false);
                      setEditingMechanism(null);
                    }}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Mechanism Name *
                    </label>
                    <input
                      type="text"
                      value={editingMechanism.name}
                      onChange={(e) => setEditingMechanism({ ...editingMechanism, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      } focus:outline-none focus:border-purple-500`}
                      placeholder="e.g., Glycolysis"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={editingMechanism.description || ''}
                      onChange={(e) => setEditingMechanism({ ...editingMechanism, description: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      } focus:outline-none focus:border-purple-500`}
                      placeholder="Brief description of this mechanism"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Steps</h3>
                      <button
                        onClick={() => {
                          setEditingMechanism({
                            ...editingMechanism,
                            steps: [...editingMechanism.steps, {
                              id: '',
                              mechanism_id: editingMechanism.id,
                              step_number: editingMechanism.steps.length + 1,
                              title: '',
                              explanation: '',
                              image_url: ''
                            }]
                          });
                        }}
                        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600"
                      >
                        <Plus className="w-4 h-4" />
                        Add Step
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingMechanism.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 border-l-4 border-purple-500`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-purple-500">Step {idx + 1}</span>
                            {editingMechanism.steps.length > 1 && (
                              <button
                                onClick={() => {
                                  setEditingMechanism({
                                    ...editingMechanism,
                                    steps: editingMechanism.steps.filter((_, i) => i !== idx)
                                  });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const newSteps = [...editingMechanism.steps];
                                newSteps[idx].title = e.target.value;
                                setEditingMechanism({ ...editingMechanism, steps: newSteps });
                              }}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-700 text-white' 
                                  : 'bg-white border-gray-200 text-gray-900'
                              } focus:outline-none focus:border-purple-500`}
                              placeholder="Step title (optional)"
                            />

                            <textarea
                              value={step.explanation}
                              onChange={(e) => {
                                const newSteps = [...editingMechanism.steps];
                                newSteps[idx].explanation = e.target.value;
                                setEditingMechanism({ ...editingMechanism, steps: newSteps });
                              }}
                              rows={4}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-700 text-white' 
                                  : 'bg-white border-gray-200 text-gray-900'
                              } focus:outline-none focus:border-purple-500`}
                              placeholder="Explain what happens in this step..."
                            />

                               <ImageUploader
                              value={step.image_url || ''}
                              onChange={(url) => {
                                const newSteps = [...editingMechanism.steps];
                                newSteps[idx].image_url = url;
                                setEditingMechanism({ ...editingMechanism, steps: newSteps });
                              }}
                              darkMode={darkMode}
                              user={user}
                            />
                            
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`flex gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={saveMechanism}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    💾 Save Mechanism
                  </button>
                  <button
                    onClick={() => {
                      setShowMechanismModal(false);
                      setEditingMechanism(null);
                    }}
                    className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${viewingMolecule.name}?`)) {
                          deleteMolecule(viewingMolecule.id);
                          setShowMoleculeModal(false);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowMoleculeModal(false)}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Close"
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
                  
                    <ImageUploader
                    value={editingMolecule.image_url || ''}
                    onChange={(url) => setEditingMolecule({ ...editingMolecule, image_url: url })}
                    darkMode={darkMode}
                    user={user}
                  />

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
                      <option value="course">📚 Cours</option>
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
            
            {/* FLASHCARDS CHECKBOX */}
            <div className={`border-t pt-4 mt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMolecule.use_in_flashcards !== false}
                  onChange={(e) => setEditingMolecule({ ...editingMolecule, use_in_flashcards: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🎴 Utiliser dans les flashcards
                </span>
              </label>
              <p className={`text-xs mt-1 ml-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Cette molécule apparaîtra dans le mode flashcards pour l'apprentissage
              </p>
            </div>
            
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
{/* FLASHCARD CONFIG MODAL */}
      {showFlashcardConfig && editingFlashcardConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-2xl font-bold">⚙️ Configure Flashcards</h2>
              <button
                onClick={() => {
                  setShowFlashcardConfig(false);
                  setEditingFlashcardConfig(null);
                }}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Topic: <strong>{editingFlashcardConfig.name}</strong>
              </p>

              <h3 className="font-bold mb-4">📝 Flashcard Questions</h3>
              
              {/* Question List */}
              <div className="space-y-4 mb-6">
                {(editingFlashcardConfig.flashcard_config?.question_types || []).map((q: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${q.enabled ? 'border-green-500' : darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={q.enabled}
                          onChange={(e) => {
                            const updated = { ...editingFlashcardConfig };
                            updated.flashcard_config.question_types[idx].enabled = e.target.checked;
                            setEditingFlashcardConfig(updated);
                          }}
                          className="w-5 h-5"
                        />
<div className="flex-1">
                          <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Type de question:
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const updated = { ...editingFlashcardConfig };
                              updated.flashcard_config.question_types[idx].type = e.target.value;
                              // Si on change pour image_to_name, pas besoin de field
                              if (e.target.value === 'image_to_name') {
                                updated.flashcard_config.question_types[idx].field = '';
                              }
                              setEditingFlashcardConfig(updated);
                            }}
                            className={`w-full px-3 py-2 rounded-lg mb-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                          >
                            <option value="image_to_name">🖼️ Image → Nom</option>
                            <option value="name_to_field">📝 Nom → Question</option>
                          </select>
                          
                          <input
                            type="text"
                            value={q.label}
                        
                            onChange={(e) => {
                              const updated = { ...editingFlashcardConfig };
                              updated.flashcard_config.question_types[idx].label = e.target.value;
                              setEditingFlashcardConfig(updated);
                            }}
                            className={`w-full px-3 py-2 rounded-lg mb-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                            placeholder="Question text..."
                          />
                          <select
                            value={q.field || ''}
                            onChange={(e) => {
                              const updated = { ...editingFlashcardConfig };
                              updated.flashcard_config.question_types[idx].field = e.target.value;
                              setEditingFlashcardConfig(updated);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                          >
                            <option value="">Image → Name (no field)</option>
                            <option value="primary_function">→ Primary Function</option>
                            <option value="target_receptor">→ Target Receptor</option>
                            <option value="side_effects">→ Side Effects</option>
                            <option value="drug_class">→ Drug Class</option>
                            <option value="metabolism">→ Metabolism</option>
                            <option value="description">→ Description</option>
                          </select>
                        </div>
                        
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...editingFlashcardConfig };
                          updated.flashcard_config.question_types.splice(idx, 1);
                          setEditingFlashcardConfig(updated);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question */}
              <button
                onClick={() => {
                  const updated = { ...editingFlashcardConfig };
                  if (!updated.flashcard_config) {
                    updated.flashcard_config = { question_types: [] };
                  }
                  updated.flashcard_config.question_types.push({
                    type: 'name_to_field',
                    enabled: true,
                    label: 'Nouvelle question?',
                    field: 'primary_function'
                  });
                  setEditingFlashcardConfig(updated);
                }}
                className={`w-full py-3 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} transition-all`}
              >
                ➕ Add Question
              </button>
            </div>

            {/* Footer */}
            <div className={`flex gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('topics')
                      .update({ 
                        flashcard_config: editingFlashcardConfig.flashcard_config 
                      })
                      .eq('id', editingFlashcardConfig.id);
                    
                    if (error) throw error;
                    
                    await loadChapters();
                    setShowFlashcardConfig(false);
                    setEditingFlashcardConfig(null);
                    alert('✅ Flashcard config saved!');
                  } catch (error) {
                    console.error('Error saving config:', error);
                    alert('Failed to save config');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-lg font-medium"
              >
                💾 Save Configuration
              </button>
              <button
                onClick={() => {
                  setShowFlashcardConfig(false);
                  setEditingFlashcardConfig(null);
                }}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
{/* HISTOLOGY TOPIC EDIT MODAL */}
      {editingHistologyTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingHistologyTopic.id ? 'Edit Topic' : 'New Topic'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic Name *
                </label>
                <input
                  type="text"
                  value={editingHistologyTopic.name}
                  onChange={(e) => setEditingHistologyTopic({ ...editingHistologyTopic, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="e.g., Epithelial Tissue"
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={editingHistologyTopic.description || ''}
                  onChange={(e) => setEditingHistologyTopic({ ...editingHistologyTopic, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="Brief description..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveHistologyTopic}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                💾 Save Topic
              </button>
              <button
                onClick={() => setEditingHistologyTopic(null)}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTOLOGY SLIDE EDIT MODAL */}
      {showHistologyModal && editingHistologySlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingHistologySlide.id ? 'Edit Slide' : 'New Slide'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Slide Name *
                </label>
                <input
                  type="text"
                  value={editingHistologySlide.name}
                  onChange={(e) => setEditingHistologySlide({ ...editingHistologySlide, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., Simple Squamous Epithelium"
                  autoFocus
                />
              </div>

              <ImageUploader
                value={editingHistologySlide.image_url || ''}
                onChange={(url) => setEditingHistologySlide({ ...editingHistologySlide, image_url: url })}
                darkMode={darkMode}
                user={user}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🔍 Magnification
                  </label>
                  <input
                    type="text"
                    value={editingHistologySlide.magnification || ''}
                    onChange={(e) => setEditingHistologySlide({ ...editingHistologySlide, magnification: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="e.g., 40x, 100x"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🎨 Staining
                  </label>
                  <input
                    type="text"
                    value={editingHistologySlide.staining || ''}
                    onChange={(e) => setEditingHistologySlide({ ...editingHistologySlide, staining: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="e.g., H&E, PAS"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Explanation
                </label>
                <textarea
                  value={editingHistologySlide.explanation}
                  onChange={(e) => setEditingHistologySlide({ ...editingHistologySlide, explanation: e.target.value })}
                  rows={8}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="Describe what can be observed in this slide..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveHistologySlide}
                className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                💾 Save Slide
              </button>
              <button
                onClick={() => {
                  setShowHistologyModal(false);
                  setEditingHistologySlide(null);
                }}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTOLOGY SLIDE VIEW MODAL */}
      {viewingHistologySlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-2xl font-bold">{viewingHistologySlide.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingHistologySlide(viewingHistologySlide);
                    setShowHistologyModal(true);
                    setViewingHistologySlide(null);
                  }}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${viewingHistologySlide.name}?`)) {
                      deleteHistologySlide(viewingHistologySlide.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewingHistologySlide(null)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {viewingHistologySlide.image_url && (
                <div className="bg-white rounded-xl p-4 mb-6">
                  <img 
                    src={viewingHistologySlide.image_url} 
                    alt={viewingHistologySlide.name}
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              <div className="space-y-4">
                {viewingHistologySlide.staining && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">🎨 Staining</h3>
                    <p>{viewingHistologySlide.staining}</p>
                  </div>
                )}

                {viewingHistologySlide.magnification && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">🔍 Magnification</h3>
                    <p>{viewingHistologySlide.magnification}</p>
                  </div>
                )}

                {viewingHistologySlide.explanation && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">📝 Explanation</h3>
                    <p className="whitespace-pre-wrap">{viewingHistologySlide.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
{/* MECHANISM TOPIC EDIT MODAL */}
      {editingMechanismTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingMechanismTopic.id ? 'Edit Topic' : 'New Topic'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic Name *
                </label>
                <input
                  type="text"
                  value={editingMechanismTopic.name}
                  onChange={(e) => setEditingMechanismTopic({ ...editingMechanismTopic, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="e.g., Metabolic Pathways"
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={editingMechanismTopic.description || ''}
                  onChange={(e) => setEditingMechanismTopic({ ...editingMechanismTopic, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="Brief description..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveMechanismTopic}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                💾 Save Topic
              </button>
              <button
                onClick={() => setEditingMechanismTopic(null)}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
{/* EXAM COLLECTION EDIT MODAL */}
      {editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingCollection.id ? 'Edit Collection' : 'New Collection'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={editingCollection.name}
                  onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="e.g., Pharmacology 2024"
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject
                </label>
                <input
                  type="text"
                  value={editingCollection.subject || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, subject: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="e.g., Pharmacology, Anatomy"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Year
                </label>
                <input
                  type="text"
                  value={editingCollection.year || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, year: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={editingCollection.description || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                  placeholder="Brief description..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveExamCollection}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                💾 Save Collection
              </button>
              <button
                onClick={() => setEditingCollection(null)}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOT TOPIC EDIT MODAL */}
      {showExamModal && editingHotTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              {editingHotTopic.id ? 'Edit Hot Topic' : 'New Hot Topic'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={editingHotTopic.title}
                  onChange={(e) => setEditingHotTopic({ ...editingHotTopic, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., Beta-blockers mechanism"
                  autoFocus
                />
              </div>

              <ImageUploader
                value={editingHotTopic.image_url || ''}
                onChange={(url) => setEditingHotTopic({ ...editingHotTopic, image_url: url })}
                darkMode={darkMode}
                user={user}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    📍 Slide Number
                  </label>
                  <input
                    type="text"
                    value={editingHotTopic.slide_number || ''}
                    onChange={(e) => setEditingHotTopic({ ...editingHotTopic, slide_number: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                    placeholder="e.g., 15, 23-25"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    🎯 Priority
                  </label>
                  <select
                    value={editingHotTopic.priority}
                    onChange={(e) => setEditingHotTopic({ ...editingHotTopic, priority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' })}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:border-blue-500`}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📅 Exam Years (comma separated)
                </label>
                <input
                  type="text"
                  value={editingHotTopic.exam_years?.join(', ') || ''}
                  onChange={(e) => setEditingHotTopic({ 
                    ...editingHotTopic, 
                    exam_years: e.target.value.split(',').map(y => y.trim()).filter(Boolean)
                  })}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., 2019, 2020, 2022, 2024"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Description / Explanation
                </label>
                <textarea
                  value={editingHotTopic.description || ''}
                  onChange={(e) => setEditingHotTopic({ ...editingHotTopic, description: e.target.value })}
                  rows={6}
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                  placeholder="Detailed explanation of this topic..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveHotTopic}
                className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                💾 Save Hot Topic
              </button>
              <button
                onClick={() => {
                  setShowExamModal(false);
                  setEditingHotTopic(null);
                }}
                className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOT TOPIC VIEW MODAL */}
      {viewingHotTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{viewingHotTopic.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  viewingHotTopic.priority === 'HIGH'
                    ? 'bg-red-100 text-red-700'
                    : viewingHotTopic.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {viewingHotTopic.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingHotTopic(viewingHotTopic);
                    setShowExamModal(true);
                    setViewingHotTopic(null);
                  }}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${viewingHotTopic.title}?`)) {
                      deleteHotTopic(viewingHotTopic.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewingHotTopic(null)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Section */}
                {viewingHotTopic.image_url && (
                  <div className="bg-white rounded-xl p-4">
                    <img 
                      src={viewingHotTopic.image_url} 
                      alt={viewingHotTopic.title}
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">📊 Statistics</h3>
                    <p className="text-lg">
                      Appeared <strong>{viewingHotTopic.frequency}</strong> time{viewingHotTopic.frequency > 1 ? 's' : ''}
                    </p>
                  </div>

                  {viewingHotTopic.exam_years && viewingHotTopic.exam_years.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-500">📅 Exam Years</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingHotTopic.exam_years.map(year => (
                          <span key={year} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                            {year}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingHotTopic.slide_number && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-500">📍 Slide Number</h3>
                      <p>{viewingHotTopic.slide_number}</p>
                    </div>
                  )}

                  {viewingHotTopic.description && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-gray-500">📝 Explanation</h3>
                      <p className="whitespace-pre-wrap">{viewingHotTopic.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Section */}
              {viewingHotTopic.questions && viewingHotTopic.questions.length > 0 && (
                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <h3 className="text-lg font-bold mb-4">❓ Related Questions ({viewingHotTopic.questions.length})</h3>
                  <div className="space-y-4">
                    {viewingHotTopic.questions.map((q, idx) => (
                      <div key={q.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">Q{idx + 1}. {q.question}</p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' :
                            q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        {q.answer && (
                          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <strong>Answer:</strong> {q.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
