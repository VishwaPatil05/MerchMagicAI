
import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Download, RotateCcw, AlertCircle, CheckCircle2, Loader2, ChevronRight, Layers, Trash2 } from 'lucide-react';
import { PRODUCTS, APP_NAME } from './constants';
import { LogoData, GenerationState } from './types';
import { generateMockup, editMockup } from './services/geminiService';

const App: React.FC = () => {
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const [editPrompt, setEditPrompt] = useState('');
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    currentImage: null,
    history: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo({
          base64: reader.result as string,
          mimeType: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onGenerate = async () => {
    if (!logo) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    const product = PRODUCTS.find(p => p.id === selectedProductId)?.name || 'Product';

    try {
      const result = await generateMockup(logo.base64, logo.mimeType, product);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentImage: result,
        history: prev.currentImage ? [prev.currentImage, ...prev.history] : prev.history
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate mockup. Please try again.'
      }));
      console.error(err);
    }
  };

  const onEdit = async () => {
    if (!state.currentImage || !editPrompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await editMockup(state.currentImage, editPrompt);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentImage: result,
        history: [state.currentImage!, ...prev.history],
      }));
      setEditPrompt('');
    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'AI editing failed. Please check your prompt and try again.'
      }));
      console.error(err);
    }
  };

  const downloadImage = () => {
    if (!state.currentImage) return;
    const link = document.createElement('a');
    link.href = state.currentImage;
    link.download = `mockup-${selectedProductId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const undoEdit = () => {
    if (state.history.length === 0) return;
    const [last, ...remaining] = state.history;
    setState(prev => ({
      ...prev,
      currentImage: last,
      history: remaining
    }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-96 bg-white border-b lg:border-r border-slate-200 p-6 overflow-y-auto max-h-screen lg:sticky lg:top-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Layers className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">{APP_NAME}</h1>
        </div>

        {/* Step 1: Logo */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
            Upload Brand Identity
          </h2>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3
              ${logo ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              className="hidden" 
              accept="image/*"
            />
            {logo ? (
              <div className="text-center">
                <img src={logo.base64} alt="Logo preview" className="h-16 w-16 object-contain mb-2 mx-auto rounded shadow-sm" />
                <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{logo.name}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setLogo(null); }}
                  className="text-xs text-red-500 mt-2 hover:underline"
                >
                  Remove logo
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-100 p-3 rounded-full">
                  <Upload className="text-slate-400 w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload logo</p>
                  <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Step 2: Product */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
            Select Canvas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => setSelectedProductId(prod.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedProductId === prod.id 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-100 hover:border-indigo-200'
                }`}
              >
                <span className="text-xl mb-1 block">{prod.icon}</span>
                <p className="text-xs font-bold leading-tight">{prod.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Action Button */}
        <button
          disabled={!logo || state.isGenerating}
          onClick={onGenerate}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          {state.isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          {state.currentImage ? 'Regenerate Mockup' : 'Generate Mockup'}
        </button>

        {/* AI Editing Controls (Only visible when image exists) */}
        {state.currentImage && !state.isGenerating && (
          <section className="mt-10 pt-8 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Magic Edits
            </h2>
            <div className="space-y-4">
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g., 'Add a vintage polaroid filter' or 'Make the lighting more dramatic'"
                className="w-full p-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all"
              />
              <button
                disabled={!editPrompt.trim() || state.isGenerating}
                onClick={onEdit}
                className="w-full bg-slate-900 hover:bg-black text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Apply AI Edit
              </button>
              
              {state.history.length > 0 && (
                <button
                  onClick={undoEdit}
                  className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600 font-medium py-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  Revert last change
                </button>
              )}
            </div>
          </section>
        )}
      </aside>

      {/* Main Display Area */}
      <main className="flex-1 p-6 lg:p-12 flex flex-col items-center justify-center relative bg-[#f1f5f9]">
        {state.error && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl shadow-sm z-10 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{state.error}</span>
            <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="ml-4 hover:bg-red-100 p-1 rounded">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          </div>
        )}

        <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8 h-full">
          {!state.currentImage && !state.isGenerating ? (
            <div className="text-center space-y-6 max-w-md animate-in fade-in zoom-in duration-700">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full"></div>
                <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                  <ImageIcon className="w-16 h-16 text-indigo-400 mx-auto" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Your mockup will appear here</h3>
                <p className="text-slate-500 mt-2">Upload a logo and select a product to begin your design journey.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> Professional 2.5 Image
                </span>
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> Smart Logo Placement
                </span>
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> AI Natural Lighting
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              <div className="relative group w-full aspect-[4/3] max-h-[70vh] flex items-center justify-center bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 border border-slate-100 overflow-hidden">
                {state.isGenerating ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
                    </div>
                    <p className="text-indigo-600 font-semibold tracking-wide animate-bounce">AI is working its magic...</p>
                    <p className="text-slate-400 text-sm">Crafting the perfect mockup for your brand</p>
                  </div>
                ) : (
                  <img 
                    src={state.currentImage!} 
                    alt="Generated Mockup" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {state.currentImage && !state.isGenerating && (
                <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-3 rounded-2xl font-semibold shadow-sm transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Export Print-Ready
                  </button>
                  <button 
                    onClick={() => {
                      setState(prev => ({ ...prev, currentImage: null, history: [] }));
                    }}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-semibold transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Hint */}
        {!state.currentImage && (
          <div className="absolute bottom-10 text-slate-400 text-sm italic">
            Powered by Gemini 2.5 Flash for high-fidelity product visualization
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
