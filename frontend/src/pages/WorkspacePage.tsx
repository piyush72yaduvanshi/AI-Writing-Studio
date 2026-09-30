import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EditorHeader } from '../components/EditorHeader';
import { WritingEditor } from '../components/WritingEditor';
import { ActionToolbar } from '../components/ActionToolbar';
import { VersionsModal } from '../components/VersionsModal';
import { documentsApi } from '../api/documents';
import { aiApi } from '../api/ai';
import { WritingMode, WritingLanguage, WritingTone } from '../types/document';
import { AIAction, AIResponseData } from '../types/ai';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isNew = !id || id === 'new';

  // Workspace Document State
  const [docId, setDocId] = useState<string | null>(isNew ? null : id);
  const [title, setTitle] = useState(isNew ? 'Untitled Writing' : '');
  const [content, setContent] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [mode, setMode] = useState<WritingMode>('blog');
  const [language, setLanguage] = useState<WritingLanguage>((user?.preferred_language as any) || 'English');
  const [tone, setTone] = useState<WritingTone>((user?.preferred_tone as any) || 'Simple');
  const [useRag, setUseRag] = useState(true);

  // Autosave and status
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to always maintain up-to-date document attributes, preventing stale closures in timers
  const docRef = useRef({
    docId: isNew ? null : id,
    title: isNew ? 'Untitled Writing' : '',
    content: '',
    aiResult: '',
    mode: 'blog' as WritingMode,
    language: ((user?.preferred_language as any) || 'English') as WritingLanguage,
    tone: ((user?.preferred_tone as any) || 'Simple') as WritingTone,
    isSaving: false,
  });

  // Synchronize ref on state updates
  useEffect(() => {
    docRef.current.docId = docId;
    docRef.current.title = title;
    docRef.current.content = content;
    docRef.current.aiResult = aiResult;
    docRef.current.mode = mode;
    docRef.current.language = language;
    docRef.current.tone = tone;
  }, [docId, title, content, aiResult, mode, language, tone]);

  // AI execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastAiMeta, setLastAiMeta] = useState<AIResponseData | null>(null);

  // Versions Modal
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  // Query existing document if editing
  const { data: documentData, isLoading: isDocLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.get(docId!),
    enabled: !!docId && !isNew,
  });

  // Populate data when document loads
  useEffect(() => {
    if (documentData) {
      setTitle(documentData.title);
      setContent(documentData.content);
      setAiResult(documentData.ai_result || '');
      setMode(documentData.mode);
      setLanguage(documentData.language);
      setTone(documentData.tone);

      docRef.current = {
        docId: documentData.id,
        title: documentData.title,
        content: documentData.content,
        aiResult: documentData.ai_result || '',
        mode: documentData.mode,
        language: documentData.language,
        tone: documentData.tone,
        isSaving: false,
      };
      setHasUnsavedChanges(false);
    }
  }, [documentData]);

  // Query versions
  const { data: versionsData = [], refetch: refetchVersions } = useQuery({
    queryKey: ['document-versions', docId],
    queryFn: () => documentsApi.listVersions(docId!),
    enabled: !!docId,
  });

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Immediate Save Execution (used for immediate triggers like "Use as Draft" and manual save)
  const saveDocumentNow = useCallback(async (overrides?: Partial<typeof docRef.current>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (overrides) {
      Object.assign(docRef.current, overrides);
    }

    const currentData = { ...docRef.current };

    // Don't auto-create blank placeholder document in DB
    if (!currentData.docId && !currentData.content.trim() && !currentData.aiResult.trim() && (!currentData.title.trim() || currentData.title === 'Untitled Writing')) {
      return;
    }

    setIsSaving(true);
    docRef.current.isSaving = true;

    try {
      if (currentData.docId) {
        // Update existing document
        await documentsApi.update(currentData.docId, {
          title: currentData.title || 'Untitled Writing',
          content: currentData.content,
          ai_result: currentData.aiResult,
          mode: currentData.mode,
          language: currentData.language,
          tone: currentData.tone,
        });
      } else {
        // Create new document in database
        const created = await documentsApi.create({
          title: currentData.title || 'Untitled Writing',
          content: currentData.content,
          ai_result: currentData.aiResult,
          mode: currentData.mode,
          language: currentData.language,
          tone: currentData.tone,
        });
        docRef.current.docId = created.id;
        setDocId(created.id);
        navigate(`/workspace/${created.id}`, { replace: true });
      }

      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      console.error('Autosave error:', err);
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
      docRef.current.isSaving = false;
    }
  }, [navigate, queryClient]);

  // Debounced Autosave Trigger (750ms for responsive, non-blocking background saving)
  const scheduleAutosave = useCallback((overrides?: Partial<typeof docRef.current>) => {
    setHasUnsavedChanges(true);
    if (overrides) {
      Object.assign(docRef.current, overrides);
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDocumentNow();
    }, 750);
  }, [saveDocumentNow]);

  // Field change handlers with automatic autosave
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    docRef.current.title = newTitle;
    scheduleAutosave({ title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    docRef.current.content = newContent;
    scheduleAutosave({ content: newContent });
  };

  const handleAiResultChange = (newResult: string) => {
    setAiResult(newResult);
    docRef.current.aiResult = newResult;
    scheduleAutosave({ aiResult: newResult });
  };

  const handleModeChange = (newMode: WritingMode) => {
    setMode(newMode);
    docRef.current.mode = newMode;
    scheduleAutosave({ mode: newMode });
  };

  const handleLanguageChange = (newLanguage: WritingLanguage) => {
    setLanguage(newLanguage);
    docRef.current.language = newLanguage;
    scheduleAutosave({ language: newLanguage });
  };

  const handleToneChange = (newTone: WritingTone) => {
    setTone(newTone);
    docRef.current.tone = newTone;
    scheduleAutosave({ tone: newTone });
  };

  // Immediate save when "Use as Draft" is clicked
  const handleApplyToOriginal = (appliedText: string) => {
    setContent(appliedText);
    docRef.current.content = appliedText;
    saveDocumentNow({ content: appliedText });
  };

  // Global Keyboard Shortcuts (Ctrl+S to save, Ctrl+Enter to improve)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocumentNow();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating && docRef.current.content.trim()) {
          handleAIAction('improve');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDocumentNow, isGenerating]);

  // AI Action Execution with Resilient Async Celery Queue Fallback
  const handleAIAction = async (action: AIAction, customInstruction?: string) => {
    if (!docRef.current.content.trim()) return;

    setAiError(null);
    setIsGenerating(true);

    try {
      const response = await aiApi.executeAction(action, {
        content: docRef.current.content.trim(),
        document_id: docRef.current.docId,
        mode: docRef.current.mode,
        language: docRef.current.language,
        tone: docRef.current.tone,
        custom_instruction: customInstruction,
        use_rag: useRag,
        save_version: true,
      });

      setAiResult(response.content);
      docRef.current.aiResult = response.content;
      setLastAiMeta(response);
      setIsGenerating(false);

      if (response.document_id) {
        if (!docRef.current.docId) {
          setDocId(response.document_id);
          docRef.current.docId = response.document_id;
          navigate(`/workspace/${response.document_id}`, { replace: true });
        }
        setHasUnsavedChanges(false);
        refetchVersions();
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      } else if (docRef.current.docId) {
        setHasUnsavedChanges(false);
        refetchVersions();
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      } else {
        saveDocumentNow({ aiResult: response.content });
      }
    } catch (err: any) {
      console.warn('Sync AI action failed, attempting resilient Celery async queue execution...', err);
      try {
        const queued = await aiApi.queueAsyncAction(action, {
          content: docRef.current.content.trim(),
          document_id: docRef.current.docId,
          mode: docRef.current.mode,
          language: docRef.current.language,
          tone: docRef.current.tone,
          custom_instruction: customInstruction,
          use_rag: useRag,
          save_version: true,
        });

        // Poll task status every 1.5s
        let pollCount = 0;
        const maxPolls = 35; // 35 * 1.5s = ~50 seconds max
        const pollInterval = setInterval(async () => {
          pollCount += 1;
          try {
            const taskStatus = await aiApi.getTaskStatus(queued.task_id);
            if (taskStatus.status === 'COMPLETED' && taskStatus.data) {
              clearInterval(pollInterval);
              const data = taskStatus.data;
              setAiResult(data.content);
              docRef.current.aiResult = data.content;
              setLastAiMeta(data);
              setIsGenerating(false);

              if (data.document_id && !docRef.current.docId) {
                setDocId(data.document_id);
                docRef.current.docId = data.document_id;
                navigate(`/workspace/${data.document_id}`, { replace: true });
              }
              if (docRef.current.docId || data.document_id) {
                setHasUnsavedChanges(false);
                refetchVersions();
                queryClient.invalidateQueries({ queryKey: ['documents'] });
              } else {
                saveDocumentNow({ aiResult: data.content });
              }
            } else if (taskStatus.status === 'FAILED') {
              clearInterval(pollInterval);
              setAiError(taskStatus.error || 'AI generation failed in queue.');
              setIsGenerating(false);
            } else if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              setAiError('Generation timed out. Please check background tasks history.');
              setIsGenerating(false);
            }
          } catch (pollErr) {
            clearInterval(pollInterval);
            setAiError('Failed to poll background task status.');
            setIsGenerating(false);
          }
        }, 1500);
      } catch (queueErr: any) {
        setAiError(queueErr.message || 'AI generation failed. Please check provider connection in Settings.');
        setIsGenerating(false);
      }
    }
  };

  // Checkpoint & Restore handlers
  const handleCreateCheckpoint = async (summary: string) => {
    if (!docRef.current.docId) return;
    await documentsApi.createVersion(docRef.current.docId, summary);
    refetchVersions();
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!docRef.current.docId) return;
    const restored = await documentsApi.restoreVersion(docRef.current.docId, versionId);
    setTitle(restored.title);
    setContent(restored.content);
    setAiResult(restored.ai_result || '');
    docRef.current.title = restored.title;
    docRef.current.content = restored.content;
    docRef.current.aiResult = restored.ai_result || '';
    setHasUnsavedChanges(false);
    refetchVersions();
  };

  if (!isNew && isDocLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Editor Top Control Bar */}
      <EditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        mode={mode}
        onModeChange={handleModeChange}
        language={language}
        onLanguageChange={handleLanguageChange}
        tone={tone}
        onToneChange={handleToneChange}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenVersions={() => setIsVersionsOpen(true)}
        useRag={useRag}
        onToggleRag={() => setUseRag(!useRag)}
      />

      {/* Error Banner */}
      {aiError && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button onClick={() => setAiError(null)} className="underline hover:text-white ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Dual Pane Writing Editor (Desktop Split / Mobile Tabbed) */}
      <WritingEditor
        content={content}
        onContentChange={handleContentChange}
        aiResult={aiResult}
        onAiResultChange={handleAiResultChange}
        onApplyToOriginal={handleApplyToOriginal}
        isGenerating={isGenerating}
        lastAiMeta={lastAiMeta}
        onQuickPrompt={(qp) => handleAIAction('improve', qp)}
      />

      {/* Bottom AI Action Toolbar */}
      <ActionToolbar
        onAction={handleAIAction}
        isGenerating={isGenerating}
        contentLength={content.trim().length}
      />

      {/* Document Versions Modal */}
      {isVersionsOpen && (
        <VersionsModal
          isOpen={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          versions={versionsData}
          onRestore={handleRestoreVersion}
          onCreateCheckpoint={handleCreateCheckpoint}
        />
      )}
    </div>
  );
};
