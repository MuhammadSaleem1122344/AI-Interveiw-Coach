export default function Seg({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = String(o) === String(value);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o)}
            className={`rounded-full border-[1.5px] px-4 py-2 font-medium capitalize transition active:scale-95 ${
              on ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-cobalt"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
