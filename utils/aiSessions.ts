import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessageAttachment {
  name: string;
  mimeType: string;
  size: number;
  uri?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  image?: string;
  attachment?: ChatMessageAttachment;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const KEY_PREFIX = 'ai_chat_sessions_';

const storageKey = (userId?: string) => `${KEY_PREFIX}${userId || 'guest'}`;

const deriveTitle = (messages: ChatMessage[]): string => {
  const firstUser = messages.find((m) => m.type === 'user' && m.text.trim());
  const firstAttachment = messages.find((m) => m.attachment)?.attachment;
  const base =
    firstUser?.text.trim() ||
    firstAttachment?.name ||
    (messages.some((m) => m.image) ? 'Image conversation' : 'New chat');
  return base.length > 40 ? `${base.slice(0, 40)}…` : base;
};

export const loadSessions = async (userId?: string): Promise<ChatSession[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.warn('aiSessions: failed to load', error);
    return [];
  }
};

const persist = async (userId: string | undefined, sessions: ChatSession[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(sessions));
  } catch (error) {
    console.warn('aiSessions: failed to persist', error);
  }
};

/**
 * Create or update a session from the current message list and return the
 * full, freshly-sorted session list. The session id is preserved so callers
 * can keep editing the same conversation.
 */
export const upsertSession = async (
  userId: string | undefined,
  session: { id: string; messages: ChatMessage[]; createdAt?: number },
): Promise<ChatSession[]> => {
  const sessions = await loadSessions(userId);
  const now = Date.now();
  const existing = sessions.find((s) => s.id === session.id);
  const updated: ChatSession = {
    id: session.id,
    title: deriveTitle(session.messages),
    messages: session.messages,
    createdAt: existing?.createdAt ?? session.createdAt ?? now,
    updatedAt: now,
  };
  const next = [updated, ...sessions.filter((s) => s.id !== session.id)].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
  await persist(userId, next);
  return next;
};

export const deleteSession = async (
  userId: string | undefined,
  sessionId: string,
): Promise<ChatSession[]> => {
  const sessions = await loadSessions(userId);
  const next = sessions.filter((s) => s.id !== sessionId);
  await persist(userId, next);
  return next;
};

export const clearSessions = async (userId?: string): Promise<void> => {
  await persist(userId, []);
};
