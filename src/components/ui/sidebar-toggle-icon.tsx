interface SidebarToggleIconProps {
  className?: string;
  sidebarOpen?: boolean;
}

export function SidebarToggleIcon({ className = "size-4", sidebarOpen }: SidebarToggleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer frame */}
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Sidebar divider */}
      <line
        x1="9"
        y1="4"
        x2="9"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
