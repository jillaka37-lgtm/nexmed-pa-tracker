import { EvalSubNav } from "./EvalSubNav";

export default function EvalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <EvalSubNav />
      {children}
    </div>
  );
}
