interface Props {
  hasSession: boolean;
  onStarterClick: (prompt: string) => void;
}

const STARTERS = [
  {
    slogan: "EXPLAIN FISSION",
    prompt:
      "Explain nuclear fission from first principles. Include the mass-energy relationship, binding energy, and why heavy nuclei are fissile.",
  },
  {
    slogan: "WHAT IS k-EFFECTIVE?",
    prompt:
      "What is k-effective in reactor physics? Explain criticality, subcriticality, and supercriticality with the four-factor formula.",
  },
  {
    slogan: "RADIOACTIVE DECAY",
    prompt:
      "Walk me through the types of radioactive decay — alpha, beta, gamma — with the Bateman equations and half-life derivation.",
  },
  {
    slogan: "REACTOR KINETICS",
    prompt:
      "Explain prompt and delayed neutrons and their essential role in reactor control. Why is the delayed neutron fraction β so important?",
  },
  {
    slogan: "RADIATION SHIELDING",
    prompt:
      "How do engineers design radiation shielding? Explain the half-value layer, tenth-value layer, and attenuation coefficients.",
  },
  {
    slogan: "NEUTRON MODERATION",
    prompt:
      "What is neutron moderation and why is it needed in thermal reactors? Compare water, heavy water, and graphite as moderators.",
  },
];

export default function EmptyState({ hasSession, onStarterClick }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      {/* Atom SVG */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="mb-6 opacity-50"
        aria-hidden
      >
        <circle cx="40" cy="40" r="5" fill="#8B2635" />
        {/* Orbit 1 */}
        <ellipse
          cx="40"
          cy="40"
          rx="34"
          ry="14"
          stroke="#8B2635"
          strokeWidth="2"
          fill="none"
        />
        {/* Orbit 2 — rotated 60° */}
        <ellipse
          cx="40"
          cy="40"
          rx="34"
          ry="14"
          stroke="#8B2635"
          strokeWidth="2"
          fill="none"
          transform="rotate(60 40 40)"
        />
        {/* Orbit 3 — rotated 120° */}
        <ellipse
          cx="40"
          cy="40"
          rx="34"
          ry="14"
          stroke="#8B2635"
          strokeWidth="2"
          fill="none"
          transform="rotate(120 40 40)"
        />
        {/* Electrons */}
        <circle cx="74" cy="40" r="3" fill="#4A9BAD" />
        <circle cx="23" cy="14" r="3" fill="#4A9BAD" />
        <circle cx="23" cy="66" r="3" fill="#4A9BAD" />
      </svg>

      {/* Heading */}
      <h2
        className="font-heading text-crimson text-3xl text-center mb-2"
        style={{ letterSpacing: "0.15em" }}
      >
        {hasSession ? "BEGIN TRANSMISSION" : "SELECT A SESSION TO BEGIN"}
      </h2>
      <div className="h-px w-48 bg-crimson opacity-40 mb-6" />

      {/* Subhead */}
      {!hasSession && (
        <p className="font-body text-sm text-slate text-center mb-8 tracking-wide">
          Create a new session or select one from the sidebar
        </p>
      )}

      {/* Starter prompt cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {STARTERS.map((s) => (
          <button
            key={s.slogan}
            onClick={() => onStarterClick(s.prompt)}
            disabled={!hasSession}
            className="text-left border-2 border-crimson bg-transparent px-4 py-3 hover:bg-crimson hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors group"
          >
            <p
              className="font-heading text-crimson group-hover:text-cream text-base tracking-widest mb-1"
              style={{ letterSpacing: "0.1em" }}
            >
              {s.slogan}
            </p>
            <p className="font-body text-xs text-slate group-hover:text-sand leading-relaxed">
              {s.prompt.slice(0, 72)}…
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
