type Stage = {
  _id: string;
  order: number;
  label: string;
  status: "waiting" | "running" | "complete";
};

type ControlRoomCompilerProps = {
  stages: Stage[];
  stageLabel: (status: Stage["status"]) => string;
  compact?: boolean;
};

export function ControlRoomCompiler({
  stages,
  stageLabel,
  compact = false,
}: ControlRoomCompilerProps) {
  const completeCount = stages.filter((stage) => stage.status === "complete").length;

  return (
    <div className={compact ? "cr-compiler-rail cr-compiler-rail-compact" : "cr-compiler-rail"}>
      <div className="cr-compiler-rail-head">
        <div>
          <span className="cr-panel-kicker">Compiler pipeline</span>
          {!compact ? <h3>Seven-stage permit compile</h3> : null}
        </div>
        <span className="cr-compiler-rail-progress">
          {completeCount}/{stages.length} complete
        </span>
      </div>

      <div className="cr-compiler-track">
        {stages.map((stage, index) => (
          <div className={`cr-compiler-step cr-compiler-step-${stage.status}`} key={stage._id}>
            <div className="cr-compiler-node">
              <span>{String(stage.order).padStart(2, "0")}</span>
            </div>
            {index < stages.length - 1 ? (
              <div className={`cr-compiler-spine cr-compiler-spine-${stage.status}`} aria-hidden="true" />
            ) : null}
            <div className="cr-compiler-copy">
              <strong>{stage.label}</strong>
              <span>{stageLabel(stage.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
