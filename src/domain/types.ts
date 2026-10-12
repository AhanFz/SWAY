export type ResponseValue = 'good' | 'bad' | 'skip';
export type Totals = Record<ResponseValue, number>;
export type Story = {
  id: string; topic: string; publishedAt: string; headline: string; summary: string;
  sources: { name: string; url: string }[]; totals: Totals;
};
export type Response = { story: Story; value: ResponseValue };
