import { useEffect, useState } from 'react';
import { trustOperationsService } from '../services/trustOperationsService';
import type { TrustAssistantMessage, TrustOperationsSnapshot } from '../types/trust';

export function useTrustOperationsConsole() {
  const [tick, setTick] = useState(0);
  const [snapshot, setSnapshot] = useState<TrustOperationsSnapshot | null>(null);
  const [messages, setMessages] = useState<TrustAssistantMessage[]>(() =>
    trustOperationsService.getInitialConversation(),
  );
  const [query, setQuery] = useState('Qual impacto o cliente percebe agora?');
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        setError(null);
        const nextSnapshot = await trustOperationsService.getSnapshot(tick);

        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Trust Operations is running in degraded display mode.');
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((currentTick) => currentTick + 1);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  async function ask(question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isThinking) {
      return;
    }

    setIsThinking(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      trustOperationsService.createUserMessage(trimmedQuestion),
    ]);

    try {
      const response = await trustOperationsService.ask(trimmedQuestion);
      setMessages((currentMessages) => [...currentMessages, response]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `trust-error-${Date.now()}`,
          role: 'assistant',
          title: 'Graceful degradation',
          content:
            'Nao consegui completar a analise agora. O console preservou a UI e manteve os sinais estaticos disponiveis.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  async function askSuggestion(question: string) {
    setQuery(question);
    await ask(question);
  }

  function refresh() {
    setIsLoading(true);
    setTick((currentTick) => currentTick + 1);
  }

  return {
    snapshot,
    messages,
    query,
    isLoading,
    isThinking,
    error,
    setQuery,
    ask,
    askSuggestion,
    refresh,
  };
}
