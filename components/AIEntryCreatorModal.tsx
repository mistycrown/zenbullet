
import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle, Trash2, Tag as TagIcon } from 'lucide-react';
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Entry, Tag } from '../types';
import { getISODate, getPriorityLabel, getPriorityColor } from '../utils';
import CalendarSelect from './CalendarSelect';
import CustomSelect from './CustomSelect';

interface AIEntryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAdd: (entries: Omit<Entry, 'id' | 'createdAt'>[]) => void;
  tags: Tag[];
  currentDate: Date;
}

// Safe accessor for API Key to prevent "process is not defined" crashes in browser
const getEnvApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return '';
  }
};

const AIEntryCreatorModal: React.FC<AIEntryCreatorModalProps> = ({
  isOpen,
  onClose,
  onBatchAdd,
  tags,
  currentDate
}) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<Omit<Entry, 'id' | 'createdAt'>[]>([]);
  const [view, setView] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setError(null);

    // Schema definition for Structured Output (Gemini)
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "Title and details of the task/event." },
          date: { type: Type.STRING, description: "YYYY-MM-DD format, or null if unscheduled/inbox." },
          type: { type: Type.STRING, enum: ["task", "event", "note"], description: "The type of entry." },
          tag: { type: Type.STRING, description: "The collection/tag name. Default to 'Inbox' if unsure." },
          priority: { type: Type.NUMBER, description: "1 (Low), 2 (Normal), 3 (High), 4 (Critical). Default 2." }
        },
        required: ["content", "type", "tag", "priority"],
      }
    };

    const systemPrompt = `
      You are an intelligent scheduling assistant. Parse the user's natural language input into a structured JSON array of tasks/events.
      
      Current Date: ${getISODate(currentDate)} (Use this to calculate relative dates like 'tomorrow', 'next friday')
      Available Collections: ${tags.map(t => t.name).join(', ')}, Inbox
    `;

    try {
      let content = "";
      const savedConfig = localStorage.getItem('llm_config');
      const config = savedConfig ? JSON.parse(savedConfig) : {};

      // 1. Check for Custom Provider Configuration (Assuming OpenAI-compatible)
      if (config.apiKey && config.baseUrl) {
         // Enhance Prompt for Custom API to act like Schema
         const promptWithSchema = `${systemPrompt}\n\nIMPORTANT: Return strictly valid JSON array. Example: [{"content": "...", "type": "task", "tag": "Work", "priority": 2, "date": "2024-01-01"}]`;
         
         // Attempt to use JSON mode if supported by the provider/model
         const bodyPayload: any = {
            model: config.modelName || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: promptWithSchema },
              { role: 'user', content: input }
            ],
            temperature: 0.7,
         };

         // Add response_format for models that support it (OpenAI, DeepSeek, etc)
         // We wrap in try/catch regarding the specific param or just add it optimistically
         // For maximum compatibility, we rely on the system prompt, but adding this helps.
         if (!config.modelName?.includes('gpt-3.5-turbo-instruct')) {
             bodyPayload.response_format = { type: "json_object" };
             // When using json_object, we must instruct the model to output JSON.
             // We wrapper the result in a root object to satisfy strict json_object requirements usually requiring { "entries": [...] }
             bodyPayload.messages[0].content += "\nOutput a JSON object with a key 'entries' containing the array.";
         }

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
          throw new Error(`Custom API Error: ${response.statusText}`);
        }

        const data = await response.json();
        let rawContent = data.choices[0].message.content;

        // Handle the potentially wrapped JSON object from Custom API
        try {
            const parsedObj = JSON.parse(rawContent);
            if (parsedObj.entries && Array.isArray(parsedObj.entries)) {
                content = JSON.stringify(parsedObj.entries); // Normalize back to array string for shared parsing below
            } else if (Array.isArray(parsedObj)) {
                content = rawContent;
            } else {
                 // Fallback if model ignored instructions and returned raw JSON array string
                 content = rawContent;
            }
        } catch {
            content = rawContent;
        }
      } 
      // 2. Default Gemini Environment (Using Structured Outputs)
      else {
        const apiKey = getEnvApiKey();
        if (!apiKey) {
            throw new Error("API Key not found. Please configure AI settings or provide a default key.");
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          config: { 
            responseMimeType: 'application/json',
            responseSchema: responseSchema, // Use Typed Schema
            systemInstruction: systemPrompt
          },
          contents: [
             { parts: [{ text: input }] }
          ]
        });
        
        content = response.text || "[]";
      }

      // Shared Cleaning Logic
      // Clean up potential markdown code blocks for BOTH providers to be safe
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error("JSON Parse Error", content);
        throw new Error("Failed to parse AI response. Please try again.");
      }
      
      if (Array.isArray(parsed)) {
        // Post-processing to ensure tags exist, defaulting to Inbox if AI hallucinates a tag
        const cleanParsed = parsed.map((p: any) => ({
            ...p,
            tag: tags.some(t => t.name === p.tag) ? p.tag : 'Inbox',
            priority: p.priority || 2,
            type: p.type || 'task'
        }));
        setPreviewEntries(cleanParsed);
        setView('preview');
      } else {
        throw new Error('Invalid response format received from AI.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate tasks.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePreview = (index: number, field: keyof Omit<Entry, 'id' | 'createdAt'>, value: any) => {
     setPreviewEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handleCyclePriority = (index: number) => {
    setPreviewEntries(prev => prev.map((e, i) => {
        if (i !== index) return e;
        const current = e.priority || 2;
        const next = current >= 4 ? 1 : current + 1;
        return { ...e, priority: next };
    }));
  };

  const handleRemovePreview = (index: number) => {
     setPreviewEntries(prev => prev.filter((_, i) => i !== index));
     if (previewEntries.length <= 1) {
       setView('input');
     }
  };

  const handleConfirm = () => {
    onBatchAdd(previewEntries);
    handleClose();
  };

  const handleClose = () => {
    setInput('');
    setPreviewEntries([]);
    setView('input');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2 text-ink">
            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-lg font-hand">Smart Add</h3>
          </div>
          <button onClick={handleClose}><X size={20} className="text-stone-400 hover:text-ink" /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {view === 'input' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                 <p className="text-sm text-stone-500">
                   Describe your plans naturally.
                 </p>
                 <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full font-bold">
                   {localStorage.getItem('llm_config') ? 'Custom API' : 'Gemini 2.5'}
                 </span>
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Meeting with Sarah tomorrow at 10am #Work, buy milk !!urgent, and call mom on Sunday."
                className="w-full h-40 p-4 bg-stone-50 rounded-xl border border-stone-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none resize-none text-ink placeholder:text-stone-400"
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="font-bold text-stone-700">Review & Edit ({previewEntries.length})</h4>
                 <button onClick={() => setView('input')} className="text-xs text-stone-400 hover:text-ink underline">Discard & Restart</button>
               </div>
               
               <div className="space-y-3">
                 {previewEntries.map((entry, idx) => (
                   <div key={idx} className="p-3 rounded-xl border border-stone-100 bg-white shadow-sm hover:border-purple-200 transition-colors group">
                      <div className="flex gap-3 mb-2">
                         {/* Content Input */}
                         <input 
                            type="text"
                            value={entry.content}
                            onChange={(e) => handleUpdatePreview(idx, 'content', e.target.value)}
                            className="flex-1 font-medium text-sm text-ink bg-transparent border-b border-transparent focus:border-purple-300 outline-none focus:bg-purple-50/50 rounded-sm px-1"
                         />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                         {/* Date Picker */}
                         <div className="min-w-[140px] flex-1">
                           <CalendarSelect 
                             value={entry.date || null} 
                             onChange={(d) => handleUpdatePreview(idx, 'date', d)}
                             showShortcuts={false}
                           />
                         </div>

                         {/* Tag Selector */}
                         <div className="min-w-[100px] flex-1">
                             <CustomSelect
                               value={entry.tag}
                               onChange={(val) => handleUpdatePreview(idx, 'tag', val)}
                               options={[
                                  { value: 'Inbox', label: 'Inbox' },
                                  ...tags.map(t => ({ value: t.name, label: t.name }))
                               ]}
                               icon={TagIcon}
                               placeholder="Collection"
                             />
                         </div>

                         {/* Cycling Priority Button */}
                         <button
                           onClick={() => handleCyclePriority(idx)}
                           className="h-[38px] px-3 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 text-[10px] font-bold transition-colors flex items-center justify-center min-w-[40px]"
                           title="Click to cycle priority"
                         >
                            <span className={getPriorityColor(entry.priority || 2)}>
                              {getPriorityLabel(entry.priority || 2)}
                            </span>
                         </button>

                         {/* Delete Button */}
                         <button 
                            onClick={() => handleRemovePreview(idx)}
                            className="h-[38px] w-[38px] flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Remove item"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-100 bg-stone-50 rounded-b-2xl flex justify-center gap-3 z-10">
          {view === 'input' ? (
             <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-xl font-medium disabled:opacity-50 hover:bg-stone-700 transition-all active:scale-95"
             >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               {isGenerating ? 'Analyzing...' : 'Generate Tasks'}
             </button>
          ) : (
             <>
               <button 
                 onClick={() => setView('input')}
                 className="px-5 py-3 text-stone-500 font-medium hover:text-ink transition-colors"
               >
                 Back
               </button>
               <button
                 onClick={handleConfirm}
                 className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-200"
               >
                 <Check size={18} />
                 Confirm {previewEntries.length} Items
               </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEntryCreatorModal;
