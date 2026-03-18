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
    <aside className="w-[200px] min-h-screen border-r px-5 py-6"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
      <div className="text-[15px] font-semibold mb-8 tracking-tight"
        style={{ color: "var(--text-primary)" }}>
        Groundwork
      </div>
      <nav className="flex flex-col gap-3.5">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isPast = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center gap-2.5">
              <span
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={
                  isActive || isPast
                    ? { background: "var(--text-primary)", color: "var(--bg-sidebar)" }
                    : { border: "1.5px solid var(--text-muted)", color: "var(--text-muted)" }
                }
              >
                {isPast ? "✓" : step.number}
              </span>
              <span
                className="text-[14px]"
                style={{ color: isActive || isPast ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
