import RoleDashboard from "./dashboard/components/RoleDashboard";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleDashboard>{children}</RoleDashboard>;
}
  