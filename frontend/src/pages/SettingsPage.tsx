import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Key,
  Globe,
  Save,
  Check,
  Zap,
  Cpu,
  Bot,
  Layers
} from 'lucide-react';
import { aiApi } from '../api/ai';
import { healthApi } from '../api/health';

export const SettingsPage: React.FC = () => {
  const { data: config, refetch: refetchConfig } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => aiApi.getConfig(),
  });

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['health-check'],
    queryFn: () => healthApi.check(),
  });

  // Local Provider & Keys state
  const [provider, setProvider] = useState<string>('openrouter');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [openrouterKey, setOpenrouterKey] = useState<string>('');
  const [openrouterModel, setOpenrouterModel] = useState<string>('deepseek/deepseek-chat');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4o-mini');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Test prompt state
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: string;
    model?: string;
    text: string;
    ms: number;
    prompt?: string;
    input_tokens?: number;
    output_tokens?: number;
  } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    const savedProv = localStorage.getItem('custom_ai_provider') || 'openrouter';
    const savedGemini = localStorage.getItem('custom_gemini_key') || '';
    let savedGeminiModel = localStorage.getItem('custom_gemini_model') || 'gemini-3.5-flash';
    if (savedGeminiModel.includes('1.5') || savedGeminiModel.includes('2.0') || savedGeminiModel.includes('2.5')) {
      savedGeminiModel = 'gemini-3.5-flash';
      localStorage.setItem('custom_gemini_model', 'gemini-3.5-flash');
    }
    const savedOpenRouter = localStorage.getItem('custom_openrouter_key') || '';
    const savedOpenRouterModel = localStorage.getItem('custom_openrouter_model') || 'deepseek/deepseek-chat';
    const savedOpenAI = localStorage.getItem('custom_openai_key') || '';
    const savedOpenAIModel = localStorage.getItem('custom_openai_model') || 'gpt-4o-mini';

    setProvider(savedProv);
    setGeminiKey(savedGemini);
    setGeminiModel(savedGeminiModel);
    setOpenrouterKey(savedOpenRouter);
    setOpenrouterModel(savedOpenRouterModel);
    setOpenaiKey(savedOpenAI);
    setOpenaiModel(savedOpenAIModel);
  }, []);

  const handleSaveProviderSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('custom_ai_provider', provider);

    if (geminiKey.trim()) localStorage.setItem('custom_gemini_key', geminiKey.trim());
    else localStorage.removeItem('custom_gemini_key');
    localStorage.setItem('custom_gemini_model', geminiModel);

    if (openrouterKey.trim()) localStorage.setItem('custom_openrouter_key', openrouterKey.trim());
    else localStorage.removeItem('custom_openrouter_key');
    localStorage.setItem('custom_openrouter_model', openrouterModel);

    if (openaiKey.trim()) localStorage.setItem('custom_openai_key', openaiKey.trim());
    else localStorage.removeItem('custom_openai_key');
    localStorage.setItem('custom_openai_model', openaiModel);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async (targetProvider: string) => {
    setTestingProvider(targetProvider);
    setTestResult(null);
    setTestError(null);

    let keyToUse = '';
    let modelToUse = '';
    if (targetProvider === 'gemini') {
      keyToUse = geminiKey;
      modelToUse = geminiModel;
    } else if (targetProvider === 'openrouter') {
      keyToUse = openrouterKey;
      modelToUse = openrouterModel;
    } else if (targetProvider === 'openai') {
      keyToUse = openaiKey;
      modelToUse = openaiModel;
    }

    const testPrompts = [
      'In one crisp sentence, give a golden rule for writing high-tension thriller dialogue.',
      'In one inspiring sentence, share advice for a storyteller conquering the blank page.',
      'In one punchy sentence, give an imaginative tip for crafting an unforgettable story climax.',
      'In one sharp sentence, describe what makes a fictional protagonist deeply memorable.',
      'In one vivid sentence, explain how sensory details elevate emotional storytelling.'
    ];
    const chosenPrompt = testPrompts[Math.floor(Math.random() * testPrompts.length)];

    try {
      const res = await aiApi.executeAction('improve', {
        content: chosenPrompt,
        provider: targetProvider,
        api_key: keyToUse || undefined,
        model: modelToUse || undefined,
        use_rag: false,
      });

      setTestResult({
        provider: targetProvider,
        model: res.model,
        text: res.content,
        ms: res.duration_ms,
        prompt: chosenPrompt,
        input_tokens: res.input_tokens,
        output_tokens: res.output_tokens,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Connection test failed';
      setTestError(`${targetProvider.toUpperCase()} Error: ${msg}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const isGeminiConfigured = Boolean(geminiKey || config?.providers?.gemini?.configured);
  const isOpenRouterConfigured = Boolean(openrouterKey || config?.providers?.openrouter?.configured);
  const isOpenAIConfigured = Boolean(openaiKey || config?.providers?.openai?.configured);

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-indigo-400" />
            AI Provider & Cloud Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cloud-first architecture powered by <strong>Google Gemini</strong> and <strong>OpenRouter</strong> (Default), with custom <strong>OpenAI</strong> configuration.
          </p>
        </div>
        <button
          onClick={() => { refetchConfig(); refetchHealth(); }}
          className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Provider Form */}
      <form onSubmit={handleSaveProviderSettings} className="space-y-6">
        {/* Active Provider Selector */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/25 via-slate-900/60 to-slate-950 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <Zap className="h-4 w-4 mr-2 text-indigo-400" /> Active AI Provider Strategy
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose which cloud model brain generates your stories, screenplays, articles, and grammar improvements.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-semibold">
              Active: {provider.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                id: 'gemini',
                label: 'Google Gemini',
                tag: 'Default / Fast',
                desc: 'Gemini 2.0 Flash / 1.5 Pro. High token limits & free tier.',
                icon: Globe,
                color: 'text-blue-400',
              },
              {
                id: 'openrouter',
                label: 'OpenRouter',
                tag: 'Default / Multi-Model',
                desc: 'Llama 3.3 70B, DeepSeek V3, Mistral, Qwen 2.5.',
                icon: Layers,
                color: 'text-purple-400',
              },
              {
                id: 'openai',
                label: 'OpenAI',
                tag: 'Configurable',
                desc: 'GPT-4o, GPT-4o-mini, o1-mini. Industry standard precision.',
                icon: Bot,
                color: 'text-emerald-400',
              },
              {
                id: 'auto',
                label: 'Auto Smart-Route',
                tag: 'Failover',
                desc: 'Automatically falls back between configured cloud providers.',
                icon: Cpu,
                color: 'text-amber-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = provider === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setProvider(item.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/15 text-white ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center text-xs font-bold text-white">
                      <Icon className={`h-4 w-4 mr-1.5 ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Provider Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Google Gemini (Default) */}
          <div className="rounded-2xl border border-blue-500/20 bg-slate-950/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-blue-400" /> Google Gemini
                </span>
                {isGeminiConfigured ? (
                  <span className="text-[10px] text-emerald-400 flex items-center font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Not set</span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">API Key</label>
                  {geminiKey && (
                    <button
                      type="button"
                      onClick={() => { setGeminiKey(''); localStorage.removeItem('custom_gemini_key'); }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      title="Clear stored key to use the system key from .env"
                    >
                      Reset to .env Key
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={config?.providers?.gemini?.configured ? "Configured in .env (or enter override)" : "AQ.Ab... or AIzaSy..."}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Recommended / Instant)</option>
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra-Fast)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (High Intelligence)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Lightweight)</option>
                  <option value="gemini-3-flash-preview">gemini-3-flash-preview (Preview)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Free high-speed tier.{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center"
                >
                  Get Gemini Key ↗
                </a>
              </p>
            </div>

            <button
              type="button"
              disabled={testingProvider === 'gemini'}
              onClick={() => handleTestConnection('gemini')}
              className="w-full text-xs py-1.5 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all font-medium disabled:opacity-50"
            >
              {testingProvider === 'gemini' ? 'Testing...' : 'Test Gemini Connection'}
            </button>
          </div>

          {/* 2. OpenRouter (Default Fallback / Multi-Model) */}
          <div className="rounded-2xl border border-purple-500/20 bg-slate-950/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center">
                  <Key className="h-4 w-4 mr-2 text-purple-400" /> OpenRouter
                </span>
                {isOpenRouterConfigured ? (
                  <span className="text-[10px] text-emerald-400 flex items-center font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Not set</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-v1-... or from .env"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model</label>
                <select
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="deepseek/deepseek-chat">deepseek/deepseek-chat (Ultra-Fast 1.2s - Recommended)</option>
                  <option value="meta-llama/llama-3.1-8b-instruct">meta-llama/llama-3.1-8b-instruct (Fast 1s)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (High Reasoning)</option>
                  <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Gemini via OpenRouter)</option>
                  <option value="qwen/qwen-2.5-72b-instruct">qwen/qwen-2.5-72b-instruct</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                100+ open-weights.{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:underline inline-flex items-center"
                >
                  Get OpenRouter Key ↗
                </a>
              </p>
            </div>

            <button
              type="button"
              disabled={testingProvider === 'openrouter'}
              onClick={() => handleTestConnection('openrouter')}
              className="w-full text-xs py-1.5 px-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all font-medium disabled:opacity-50"
            >
              {testingProvider === 'openrouter' ? 'Testing...' : 'Test OpenRouter Connection'}
            </button>
          </div>

          {/* 3. OpenAI (Custom Configurable) */}
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center">
                  <Bot className="h-4 w-4 mr-2 text-emerald-400" /> OpenAI
                </span>
                {isOpenAIConfigured ? (
                  <span className="text-[10px] text-emerald-400 flex items-center font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Optional</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-... (optional)"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient)</option>
                  <option value="gpt-4o">gpt-4o (High Intelligence)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="o1-mini">o1-mini (Reasoning)</option>
                  <option value="o3-mini">o3-mini</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Official OpenAI models.{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center"
                >
                  Get OpenAI Key ↗
                </a>
              </p>
            </div>

            <button
              type="button"
              disabled={testingProvider === 'openai'}
              onClick={() => handleTestConnection('openai')}
              className="w-full text-xs py-1.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all font-medium disabled:opacity-50"
            >
              {testingProvider === 'openai' ? 'Testing...' : 'Test OpenAI Connection'}
            </button>
          </div>
        </div>

        {/* Live Test Results Box */}
        {testResult && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-400 font-semibold border-b border-emerald-500/20 pb-2">
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-400" />
                Live {testResult.provider.toUpperCase()} Cloud Inference Verified!
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                {testResult.model && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    Model: {testResult.model}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Latency: {testResult.ms} ms
                </span>
                {(testResult.input_tokens !== undefined || testResult.output_tokens !== undefined) && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    Tokens: {testResult.input_tokens || 0} in / {testResult.output_tokens || 0} out
                  </span>
                )}
              </div>
            </div>

            {testResult.prompt && (
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Prompt Sent to Neural Engine: </span>
                <span className="text-slate-300 italic">"{testResult.prompt}"</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" /> Live Generated Output:
              </div>
              <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed italic">
                "{testResult.text}"
              </p>
            </div>
          </div>
        )}

        {testError && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300">
            {testError}
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">
            Changes apply instantly to your writing studio sessions and background transformers.
          </span>
          <button
            type="submit"
            className="flex items-center space-x-1.5 text-xs font-semibold px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Configuration Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save AI Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Infrastructure Health Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center">
          <Server className="h-4 w-4 mr-2 text-indigo-400" /> Infrastructure Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">PostgreSQL</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {health?.services?.database?.status || 'Online'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Redis Cache</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {health?.services?.redis?.status || 'Online'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Qdrant Vector DB</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {health?.services?.qdrant?.status || 'Online'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Cloud AI Brain</span>
            <span className="text-indigo-400 font-semibold flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {provider.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
