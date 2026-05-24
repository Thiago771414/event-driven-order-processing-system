import { useEffect, useState } from 'react';
import { aiOperationsService } from '../services/aiOperationsService';
import type { AiAssistantMessage } from '../types/aiOps';

export function useAiOperationsConsole() {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('A API esta lenta?');
  const [isThinking, setIsThinking] = useState(false);
  const [snapshot, setSnapshot] = useState(() => aiOperationsService.getSnapshot());
  const [messages, setMessages] = useState<AiAssistantMessage[]>(() =>
    aiOperationsService.getInitialConversation(),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((currentTick) => currentTick + 1);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSnapshot(aiOperationsService.getLiveSnapshot(tick));
  }, [tick]);

  async function ask(question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isThinking) {
      return;
    }

    setIsThinking(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      aiOperationsService.createUserMessage(trimmedQuestion),
    ]);

    const assistantMessage = await aiOperationsService.ask(trimmedQuestion);

    setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    setIsThinking(false);
  }

  async function askSuggestion(question: string) {
    setQuery(question);
    await ask(question);
  }

  return {
    snapshot,
    messages,
    query,
    isThinking,
    setQuery,
    ask,
    askSuggestion,
  };
}
