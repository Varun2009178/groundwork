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
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[200px] min-h-screen border-r px-5 py-6 shrink-0"
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
                  {isPast ? "\u2713" : step.number}
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

      {/* Mobile top bar */}
      <div className="md:hidden w-full border-b px-4 py-3"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Groundwork
          </span>
          <nav className="flex items-center gap-3">
            {steps.map((step, i) => {
              const isActive = currentStep === step.number;
              const isPast = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center gap-1.5">
                  <span
                    className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={
                      isActive || isPast
                        ? { background: "var(--text-primary)", color: "var(--bg-sidebar)" }
                        : { border: "1.5px solid var(--text-muted)", color: "var(--text-muted)" }
                    }
                  >
                    {isPast ? "\u2713" : step.number}
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: isActive || isPast ? "var(--text-primary)" : "var(--text-muted)" }}
                  >
                    {step.label}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="ml-1.5 w-3 h-px" style={{ background: "var(--border-color)" }} />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
