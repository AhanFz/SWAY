import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as Crypto from 'expo-crypto';
import { dark, light, type Theme } from '../theme';
import type { ResponseValue, Story } from '../domain/types';
import { defaultPreferences, evaluateGuess, localDay, type Guess, type HistoryEntry, type Preferences } from '../domain/history';
import * as storage from '../services/storage';
import { fetchFeed, fetchTotals, isDemo, sendResponse } from '../services/api';
type State = {
  history: HistoryEntry[]; preferences: Preferences; theme: Theme; darkMode: boolean;
  ready: boolean; error: string | null; sessionId: string; feed: Story[]; loading: boolean; more: boolean;
  respond: (story: Story, value: ResponseValue) => void; guess: (id: string, guess: Guess | null) => Promise<void>;
  reveal: (entry: HistoryEntry) => Promise<void>; loadMore: () => Promise<void>;
  setPreferences: (patch: Partial<Preferences>) => Promise<void>; retry: () => Promise<void>; dismissError: () => void;
};
const Context = createContext<State | null>(null);
export function SwayProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const [preferences, setPrefs] = useState(defaultPreferences);
  const prefsRef = useRef(defaultPreferences);
  const [ready, setReady] = useState(false), [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<Story[]>([]), [loading, setLoading] = useState(false), [more, setMore] = useState(true);
  const cursor = useRef<string | null>(null), loadingRef = useRef(false), started = useRef(false);
  const queue = useRef(Promise.resolve());
  const pendingWrites = useRef(new Map<string, Promise<void>>());
  const [sessionId] = useState(() => Crypto.randomUUID());
  const modePrefix = isDemo ? 'demo:' : 'live:';
  const publish = useCallback((entries: HistoryEntry[]) => { historyRef.current = entries; setHistory(entries); }, []);
  const patchEntry = useCallback(async (id: string, patch: Partial<HistoryEntry>) => {
    const entries = historyRef.current.map(e => e.id === id ? { ...e, ...patch } : e);
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    publish(entries);
    await pendingWrites.current.get(id);
    await storage.updateResponse(entry);
  }, [publish]);
  const reveal = useCallback(async (entry: HistoryEntry) => {
    const current = historyRef.current.find(e => e.id === entry.id);
    if (!current || current.status !== 'confirmed' || current.totals) return;
    try {
      const totals = await fetchTotals(current.story, current.value);
      const outcome = totals && current.guess ? evaluateGuess(totals, current.guess) : null;
      await patchEntry(current.id, { totals, guessCorrect: outcome?.correct ?? null });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the crowd result.'); }
  }, [patchEntry]);
  const processEntry = useCallback(async (entry: HistoryEntry) => {
    try {
      const pendingWrite = pendingWrites.current.get(entry.id);
      if (pendingWrite) await pendingWrite;
      else await storage.insertResponse(entry);
      await sendResponse(entry.story, entry.value);
      await patchEntry(entry.id, { status: 'confirmed' });
      const latest = historyRef.current.find(e => e.id === entry.id)!;
      if (latest.revealed) await reveal(latest);
    } catch (e) {
      try { await patchEntry(entry.id, { status: 'error' }); } catch { /* Surface failure; never silently report success. */ }
      setError(e instanceof Error ? e.message : 'Your response could not be saved. Tap retry.');
    }
  }, [patchEntry, reveal]);
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true);
    try {
      let nextCursor = cursor.current;
      let fresh: Story[] = [];
      // Page past previously responded stories without transmitting history.
      for (let page = 0; page < 8 && fresh.length === 0; page++) {
        const result = await fetchFeed(nextCursor);
        fresh = result.stories.filter(s => !historyRef.current.some(e => e.story.id === s.id));
        nextCursor = result.cursor;
        if (!nextCursor) break;
      }
      cursor.current = nextCursor;
      setMore(nextCursor !== null);
      setFeed(current => [...current, ...fresh.filter(s => !current.some(old => old.id === s.id))]);
    } catch (e) { setError(e instanceof Error ? e.message : 'The feed could not load. Please retry.'); }
    finally { loadingRef.current = false; setLoading(false); }
  }, []);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    Promise.all([storage.readHistory(), storage.readPreferences()]).then(([saved, prefs]) => {
      publish(saved.filter(e => e.id.startsWith(modePrefix)));
      setPrefs(prefs); prefsRef.current = prefs; setReady(true);
      void loadMore();
      for (const entry of saved.filter(e => e.id.startsWith(modePrefix) && e.status !== 'confirmed')) {
        queue.current = queue.current.then(() => processEntry(entry));
      }
    }).catch(() => setError('Your private history could not open. Restart Sway to try again.'));
  }, [loadMore, modePrefix, publish, processEntry]);
  const respond = useCallback((story: Story, value: ResponseValue) => {
    if (historyRef.current.some(e => e.story.id === story.id)) return;
    const entry: HistoryEntry = { id: modePrefix + story.id, story, value, respondedAt: new Date().toISOString(), localDay: localDay(), sessionId, status: 'pending', totals: null, guess: null, guessCorrect: null, revealed: value !== 'skip' && !prefsRef.current.guessing };
    // Start the local insert immediately; never put it behind a network request.
    const persisted = storage.insertResponse(entry);
    pendingWrites.current.set(entry.id, persisted);
    void persisted.catch(() => setError('Your response could not be saved on this device. Tap Retry.'));
    publish([...historyRef.current, entry]);
    queue.current = queue.current.then(() => processEntry(entry));
  }, [modePrefix, processEntry, publish, sessionId]);
  const guess = useCallback(async (id: string, answer: Guess | null) => {
    const entry = historyRef.current.find(e => e.id === id);
    if (!entry || entry.revealed || entry.value === 'skip') return;
    try { await patchEntry(id, { guess: answer, revealed: true }); await reveal({ ...entry, guess: answer, revealed: true }); }
    catch { setError('Could not save your guess. Please retry.'); }
  }, [patchEntry, reveal]);
  const setPreferences = useCallback(async (patch: Partial<Preferences>) => {
    const next = { ...prefsRef.current, ...patch };
    try {
      await storage.savePreferences(next); prefsRef.current = next; setPrefs(next);
      if (patch.guessing === false) for (const entry of historyRef.current.filter(e => e.value !== 'skip' && !e.revealed)) await guess(entry.id, null);
    } catch { setError('Your settings could not be saved. Try again.'); }
  }, [guess]);
  const retry = useCallback(async () => {
    setError(null);
    const pending = historyRef.current.filter(e => e.status !== 'confirmed');
    for (const entry of pending) { pendingWrites.current.delete(entry.id); queue.current = queue.current.then(() => processEntry(entry)); }
    await queue.current;
    if (feed.length === 0) await loadMore();
  }, [feed.length, loadMore, processEntry]);
  const darkMode = preferences.appearance === 'dark' || (preferences.appearance === 'system' && system === 'dark');
  return <Context.Provider value={{ history, preferences, theme: darkMode ? dark : light, darkMode, ready, error, sessionId, feed, loading, more, respond, guess, reveal, loadMore, setPreferences, retry, dismissError: () => setError(null) }}>{children}</Context.Provider>;
}
export function useSway() { const state = useContext(Context); if (!state) throw new Error('SwayProvider missing'); return state; }
