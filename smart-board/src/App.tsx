import { useMemo, useState } from "react";
import "./app.css";

type Student = { id: string; name: string; pos: number; neg: number };
type TapType = "positive" | "needsWork";

const STARTERS: Student[] = [
  { id: "s1", name: "Alex", pos: 0, neg: 0 },
  { id: "s2", name: "Bri", pos: 0, neg: 0 },
  { id: "s3", name: "Casey", pos: 0, neg: 0 },
  { id: "s4", name: "Dev", pos: 0, neg: 0 },
  { id: "s5", name: "Em", pos: 0, neg: 0 },
  { id: "s6", name: "Finn", pos: 0, neg: 0 },
];

export default function App() {
  const [students, setStudents] = useState<Student[]>(STARTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = useMemo(
    () => selectedIds.size === students.length && students.length > 0,
    [selectedIds, students.length]
  );

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll(toggle?: boolean) {
    setSelectedIds((prev) => {
      if (toggle ?? !allSelected) {
        return new Set(students.map((s) => s.id));
      }
      return new Set();
    });
  }

  function tap(type: TapType) {
    if (selectedIds.size === 0) return;
    setStudents((prev) =>
      prev.map((s) =>
        selectedIds.has(s.id)
          ? { ...s, pos: s.pos + (type === "positive" ? 1 : 0), neg: s.neg + (type === "needsWork" ? 1 : 0) }
          : s
      )
    );
  }

  function resetCounts() {
    setStudents((prev) => prev.map((s) => ({ ...s, pos: 0, neg: 0 })));
  }

  return (
    <div className="wrap">
      <header className="toolbar">
        <button className="action positive" onClick={() => tap("positive")} aria-label="Give positive tap">+ Tap</button>
        <button className="action needs" onClick={() => tap("needsWork")} aria-label="Give needs-work tap">– Tap</button>
        <button className="action" onClick={() => selectAll()}>{allSelected ? "Clear All" : "Select All"}</button>
        <button className="action ghost" onClick={resetCounts}>Reset</button>
      </header>

      <main className="grid">
        {students.map((s) => {
          const selected = selectedIds.has(s.id);
          return (
            <button
              key={s.id}
              className={`tile ${selected ? "selected" : ""}`}
              onClick={() => toggleStudent(s.id)}
              aria-pressed={selected}
            >
              <div className="name">{s.name}</div>
              <div className="counts">
                <span className="badge good">+{s.pos}</span>
                <span className="badge bad">−{s.neg}</span>
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
