import { longestStreak } from "./analytics";

export const BADGES = [
  { id: "first", icon: "🎯", title: "First step", desc: "Complete your first interview", test: (s) => s.length >= 1 },
  { id: "five", icon: "🔥", title: "On a roll", desc: "Complete 5 interviews", test: (s) => s.length >= 5 },
  { id: "ten", icon: "🏆", title: "Dedicated", desc: "Complete 10 interviews", test: (s) => s.length >= 10 },
  { id: "s8", icon: "⭐", title: "Strong performer", desc: "Score 8+ in an interview", test: (s) => s.some((x) => x.overall >= 8) },
  { id: "s9", icon: "💎", title: "Interview ready", desc: "Score 9+ in an interview", test: (s) => s.some((x) => x.overall >= 9) },
  { id: "perfect", icon: "✨", title: "Perfect answer", desc: "Get 10/10 on a single answer", test: (s) => s.some((x) => (x.turns || []).some((t) => t.score >= 10)) },
  { id: "streak3", icon: "📅", title: "3-day streak", desc: "Practise 3 days in a row", test: (s) => longestStreak(s) >= 3 },
  { id: "comeback", icon: "📈", title: "Comeback", desc: "Beat your average by 1.5+ points", test: (s) => s.some((x) => x.prev != null && x.overall - x.prev >= 1.5) },
  { id: "allround", icon: "🧩", title: "All-rounder", desc: "Try all three interview types", test: (s) => new Set(s.map((x) => x.kind)).size >= 3 },
];

export const earned = (sessions) => BADGES.map((b) => ({ ...b, done: b.test(sessions) }));
