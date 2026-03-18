interface StepSidebarProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Describe" },
  { number: 2, label: "Review" },
  { number: 3, label: "Export" },
] as const;

export default function StepSidebar({ currentStep }: StepSidebarProps) {
  return (
    <div className="w-full border-b px-6 py-4"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Groundwork
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent)", color: "var(--text-secondary)" }}>
            beta
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {steps.map((step, i) => {
            const isActive = currentStep === step.number;
            const isPast = currentStep > step.number;
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all-200"
                  style={isActive ? { background: "var(--accent)" } : {}}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={
                      isActive || isPast
                        ? { background: "var(--text-primary)", color: "var(--bg-primary)" }
                        : { border: "1.5px solid var(--text-muted)", color: "var(--text-muted)" }
                    }
                  >
                    {isPast ? "\u2713" : step.number}
                  </span>
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: isActive ? "var(--text-primary)" : isPast ? "var(--text-secondary)" : "var(--text-muted)" }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-8 h-px mx-1"
                    style={{ background: isPast ? "var(--text-secondary)" : "var(--border-color)" }} />
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
