import { stories } from './stories';
// The only feed boundary. Stage 2 replaces fixtures with newest unresponded stories.
// There is no daily cap. This checkpoint ends when its sample fixture is exhausted.
export function getFeed() { return stories; }
