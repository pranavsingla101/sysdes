"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { AiStatusPayload, AiChatMessage } from "@/types/tasks";

interface AiRoomContextValue {
  isAiThinking: boolean;
  latestStatus: AiStatusPayload | null;
  chatMessages: AiChatMessage[];
  senderName: string;
  setAiThinking: (thinking: boolean) => void;
  setLatestStatus: (status: AiStatusPayload | null) => void;
  setChatMessages: (messages: AiChatMessage[]) => void;
  setSenderName: (name: string) => void;
  registerSendMessage: (fn: (msg: AiChatMessage) => void) => void;
  sendChatMessage: (msg: AiChatMessage) => void;
}

const AiRoomContext = createContext<AiRoomContextValue | null>(null);

export function AiRoomProvider({ children }: { children: React.ReactNode }) {
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [latestStatus, setLatestStatusState] = useState<AiStatusPayload | null>(null);
  const [chatMessages, setChatMessagesState] = useState<AiChatMessage[]>([]);
  const [senderName, setSenderNameState] = useState("");
  const sendRef = useRef<((msg: AiChatMessage) => void) | null>(null);

  const setAiThinking = useCallback((thinking: boolean) => {
    setIsAiThinking(thinking);
  }, []);

  const setLatestStatus = useCallback((status: AiStatusPayload | null) => {
    setLatestStatusState(status);
  }, []);

  const setChatMessages = useCallback((messages: AiChatMessage[]) => {
    setChatMessagesState(messages);
  }, []);

  const setSenderName = useCallback((name: string) => {
    setSenderNameState(name);
  }, []);

  const registerSendMessage = useCallback((fn: (msg: AiChatMessage) => void) => {
    sendRef.current = fn;
  }, []);

  const sendChatMessage = useCallback((msg: AiChatMessage) => {
    sendRef.current?.(msg);
  }, []);

  return (
    <AiRoomContext.Provider
      value={{
        isAiThinking,
        latestStatus,
        chatMessages,
        senderName,
        setAiThinking,
        setLatestStatus,
        setChatMessages,
        setSenderName,
        registerSendMessage,
        sendChatMessage,
      }}
    >
      {children}
    </AiRoomContext.Provider>
  );
}

export function useAiRoom() {
  const ctx = useContext(AiRoomContext);
  if (!ctx) throw new Error("useAiRoom must be used within AiRoomProvider");
  return ctx;
}
