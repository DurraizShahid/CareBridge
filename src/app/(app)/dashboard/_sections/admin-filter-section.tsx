interface AdminFilterSectionProps {
  adminName?: string | null;
}

export default function AdminFilterSection({
  adminName,
}: AdminFilterSectionProps) {
  return (
    <div className="mb-8">
      <h1 className="text-[40px] font-semibold text-sa-foreground leading-tight tracking-tight">
        Welcome, {adminName ?? "Super Admin"}
      </h1>
    </div>
  );
}
