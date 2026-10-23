const H = 3600_000;
export function plan(n: number, senders: number, start: number, delayMs: number, limit: number) {
  const cur: number[] = Array(senders).fill(start);
  const used = Array.from({ length: senders }, () => new Map<number, number>());
  return Array.from({ length: n }, (_, i) => {
    const s = i % senders;
    let t = cur[s];
    while ((used[s].get(Math.floor(t / H)) ?? 0) >= limit) t = (Math.floor(t / H) + 1) * H;
    const hk = Math.floor(t / H);
    used[s].set(hk, (used[s].get(hk) ?? 0) + 1);
    cur[s] = t + delayMs;
    return { senderIdx: s, at: t };
  });
}
