import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageLayout({ title, subtitle, action, children }: Props) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <div className={`pageWrap anim-fade-in${hasHeader ? " withHeader" : ""}`}>
      {hasHeader ? (
        <div className="sectionHead">
          <div className="sectionHeadCopy">
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p className="subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="sectionAction">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
