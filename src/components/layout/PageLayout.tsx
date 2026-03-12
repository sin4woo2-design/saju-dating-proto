import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageLayout({ title, subtitle, action, children }: Props) {
  return (
    <div className="pageWrap anim-fade-in">
      <div className="sectionHead">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="sectionAction">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}
