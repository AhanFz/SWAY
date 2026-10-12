import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, classifyTopic, excerpt, headlineTokens, plainText, sameStory, validSummary } from '../supabase/functions/_shared/news.ts';
test('reports of the same event group together; different events do not', () => {
  const a = headlineTokens('Earthquake of magnitude 7.1 strikes northern Japan, tsunami warning issued');
  const b = headlineTokens('Magnitude 7.1 earthquake strikes northern Japan; tsunami warning issued');
  assert.equal(sameStory(a, b), true);
  assert.equal(sameStory(a, headlineTokens('Japan’s central bank holds interest rates steady')), false);
  assert.equal(sameStory(headlineTokens('Arsenal beat Chelsea 2-1'), headlineTokens('Arsenal beat Tottenham 3-0')), false);
  assert.equal(sameStory([], []), false);
});
test('feed snippet normalization never retains markup and bounds stored text', () => {
  assert.equal(plainText('<p>Hello &amp; goodbye</p>'), 'Hello & goodbye');
  assert.equal(plainText('It&#8217;s&nbsp;here'), 'It’s here');
  assert.equal(plainText('&lt;script&gt;alert(1)&lt;/script&gt; safe'), 'alert(1) safe');
  assert.equal(plainText('&lt;p&gt;It&amp;#8217;s here &amp;amp; done&lt;/p&gt; &lt;a href="https://x.example"&gt;Continue reading...&lt;/a&gt;'), 'It’s here & done Continue reading...');
  assert.equal(plainText('<![CDATA[AT&amp;T &#60;b&#62;rises&#60;/b&#62;]]>'.slice(9, -3)), 'AT&T rises');
  assert.equal(plainText('a'.repeat(3000)).length, 2000);
});
test('article links drop tracking parameters and reject non-https', () => {
  assert.equal(canonicalUrl('https://www.bbc.com/news/articles/abc?at_medium=RSS&at_campaign=rss#top'), 'https://www.bbc.com/news/articles/abc');
  assert.equal(canonicalUrl('https://example.org/a?id=7&utm_source=x'), 'https://example.org/a?id=7');
  assert.equal(canonicalUrl('https://www.bbc.com/news/articles/abc?at_medium=RSS&amp;at_campaign=rss'), 'https://www.bbc.com/news/articles/abc');
  assert.equal(canonicalUrl('http://example.org/a'), null);
  assert.equal(canonicalUrl({ href: 'https://example.org' }), null);
});
test('excerpts keep whole sentences and stay within the summary limit', () => {
  assert.equal(excerpt('Short blurb here. Continue reading...'), 'Short blurb here.');
  const long = excerpt(('One two three four five six seven eight nine ten. ').repeat(20));
  assert.ok(long.split(/\s+/).length <= 80);
  assert.ok(long.endsWith('.'));
  assert.ok(excerpt('word '.repeat(200)).endsWith('…'));
});
test('general feeds get a topic by keyword and fall back to World', () => {
  assert.equal(classifyTopic('Central bank raises interest rate as inflation climbs'), 'Economy');
  assert.equal(classifyTopic('New vaccine cuts hospital admissions, doctors say'), 'Health');
  assert.equal(classifyTopic('Talks continue in the region'), 'World');
});
test('summary checks reject wrong topics and overlong output but permit sparse sources', () => {
  assert.equal(validSummary({ headline: 'Headline', summary: 'Brief source material.', topic: 'Science' }), true);
  assert.equal(validSummary({ headline: 'Headline', summary: 'word '.repeat(101), topic: 'Science' }), false);
  assert.equal(validSummary({ headline: 'Headline', summary: 'Text', topic: 'Invented' }), false);
});
