export const Separator = ({ className = "" }: { className?: string }) => (
  <div
    className={`separator bg-secondary w-px min-w-[1px] my-0 mx-[10px] ${className}`.trim()}
    data-orientation="vertical"
    aria-orientation="vertical"
    role="separator"
  />
);
