import type { ReactNode } from "react";

/** Shared max-width container for all customer-facing pages. */
export const customerContainerClassName =
  "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

/** Sticky offset below the customer header (header + orange accent). */
export const customerHeaderOffsetClassName = "top-[66px]";

interface CustomerPageShellProps {
  header: ReactNode;
  children: ReactNode;
  bottomBar?: ReactNode;
  /** Slim strip rendered inside the container below the header (table context, order type). */
  contextStrip?: ReactNode;
  /** Page title shown above main content. */
  pageTitle?: string;
  pageSubtitle?: string;
}

export function CustomerPageShell({
  header,
  children,
  bottomBar,
  contextStrip,
  pageTitle,
  pageSubtitle,
}: CustomerPageShellProps) {
  return (
    <div className="min-h-screen bg-brand-cream">
      {header}
      <main className={`${customerContainerClassName} py-4 sm:py-6`}>
        {contextStrip ? <div className="mb-4">{contextStrip}</div> : null}
        {pageTitle ? (
          <header className="mb-5 sm:mb-6">
            <h1 className="text-[22px] font-extrabold leading-tight text-brand-chocolate sm:text-[28px]">
              {pageTitle}
            </h1>
            {pageSubtitle ? (
              <p className="mt-1.5 text-sm leading-relaxed text-brand-muted sm:text-base">
                {pageSubtitle}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </main>
      {bottomBar}
    </div>
  );
}
