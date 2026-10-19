import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  centered = false,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`page-heading ${centered ? 'mx-auto text-center' : ''} ${className}`.trim()}>
      <p className="kicker">{eyebrow}</p>
      <div className={centered ? '' : 'flex flex-wrap items-end justify-between gap-5'}>
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-description">{description}</p> : null}
        </div>
        {action ? <div className={centered ? 'mt-6 flex justify-center' : 'shrink-0'}>{action}</div> : null}
      </div>
    </header>
  );
}
