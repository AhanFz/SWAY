import type { ResponseValue, Story, Totals } from '../domain/types';
import { stories } from '../data/stories';
import { deviceHash } from './identity';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isDemo = !url || !key;
export async function callApi<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  if (!url || !key) throw new Error('The live feed is not connected yet.');
  const response = await fetch(`${url}/functions/v1/sway-api`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Sway could not connect. Please try again.');
  return body;
}
export type FeedPage = { stories: Story[]; cursor: string | null };
// Single feed boundary; pagination is newest-first, with no daily cap.
// Filter responded IDs only on-device, never upload local history for the feed.
export async function fetchFeed(cursor: string | null): Promise<FeedPage> {
  if (isDemo) return { stories: cursor ? [] : stories, cursor: null };
  return callApi<FeedPage>('feed', { cursor });
}
export async function sendResponse(story: Story, value: ResponseValue): Promise<void> {
  if (isDemo) return;
  const { createProof } = await import('./integrity');
  const hash = await deviceHash();
  const challenge = await callApi<{ challenge: string }>('challenge', { deviceHash: hash });
  const payload = JSON.stringify({ storyId: story.id, value, deviceHash: hash, challenge: challenge.challenge });
  const proof = await createProof(payload, hash);
  await callApi('respond', { payload, proof });
}
export async function fetchTotals(story: Story, value: ResponseValue): Promise<Totals | null> {
  if (isDemo) return { ...story.totals, [value]: story.totals[value] + 1 };
  const result = await callApi<{ totals: Totals | null }>('results', { storyId: story.id });
  return result.totals;
}
