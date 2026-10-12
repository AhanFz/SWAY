import type { ResponseValue, Story, Totals } from './types';
export type Guess = 'good' | 'bad';
export type HistoryEntry = {
  id: string; story: Story; value: ResponseValue; respondedAt: string; localDay: string;
  sessionId: string; status: 'pending' | 'confirmed' | 'error';
  totals: Totals | null; guess: Guess | null; guessCorrect: boolean | null; revealed: boolean;
};
export type Preferences = { guessing: boolean; appearance: 'system' | 'light' | 'dark' };
export const defaultPreferences: Preferences = { guessing: false, appearance: 'system' };
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function evaluateGuess(t: Totals, guess: Guess): { correct: boolean; message: string } | null {
  if (t.good + t.bad + t.skip < 20 || t.good + t.bad === 0) return null;
  const split = Math.abs(t.good - t.bad) / (t.good + t.bad) <= 0.02;
  if (split) return { correct: true, message: 'Split decision.' };
  const correct = guess === (t.good > t.bad ? 'good' : 'bad');
  return { correct, message: correct ? 'You read the room' : 'The crowd surprised you' };
}
export function roomScore(history: HistoryEntry[]) {
  const scored = history.filter(e => e.status === 'confirmed' && e.guessCorrect !== null).slice(-50);
  return { count: scored.length, correct: scored.filter(e => e.guessCorrect).length, percent: scored.length ? Math.round(100 * scored.filter(e => e.guessCorrect).length / scored.length) : null };
}
export function agrees(e: HistoryEntry): boolean | null {
  if (e.value === 'skip' || !e.totals || e.status !== 'confirmed' || e.totals.good + e.totals.bad + e.totals.skip < 20) return null;
  if (e.totals.good === e.totals.bad) return true;
  return e.value === (e.totals.good > e.totals.bad ? 'good' : 'bad');
}
export function personalInsight(history: HistoryEntry[]): string | null {
  const confirmed = history.filter(e => e.status === 'confirmed');
  const guesses = confirmed.filter(e => e.guessCorrect !== null);
  let streak = 0;
  for (let i = guesses.length - 1; i >= 0 && guesses[i].guessCorrect; i--) streak++;
  if (streak >= 5) return `You've read the room correctly ${streak} times in a row.`;
  const votes = confirmed.filter(e => agrees(e) !== null);
  const days = [...new Set(votes.map(e => e.localDay))].sort().reverse();
  let minorityDays = 0;
  for (let i = 0; i < days.length; i++) {
    const dayVotes = votes.filter(e => e.localDay === days[i]);
    if (dayVotes.filter(e => agrees(e) === false).length <= dayVotes.length / 2) break;
    if (i > 0 && (Date.parse(days[i - 1] + 'T12:00:00Z') - Date.parse(days[i] + 'T12:00:00Z')) !== 86400000) break;
    minorityDays++;
  }
  if (minorityDays >= 5) return `You've been in the minority ${minorityDays} days in a row.`;
  if (votes.length < 10) return null;
  const topics = [...new Set(confirmed.map(e => e.story.topic))];
  const topicRates = topics.map(topic => {
    const entries = votes.filter(e => e.story.topic === topic);
    return { topic, count: entries.length, disagree: entries.filter(e => agrees(e) === false).length / entries.length };
  }).filter(t => t.count >= 10).sort((a, b) => b.disagree - a.disagree);
  if (topicRates[0]?.disagree >= 0.6) return `On ${topicRates[0].topic}, your view differed from the crowd ${Math.round(topicRates[0].disagree * 100)}% of the time.`;
  for (const topic of topics) {
    const entries = confirmed.filter(e => e.story.topic === topic);
    if (entries.length >= 10 && entries.filter(e => e.value === 'skip').length > entries.length / 2) return `You skip most ${topic} stories.`;
  }
  return `You sided with the majority on ${votes.slice(-10).filter(e => agrees(e)).length} of your last 10 votes.`;
}
