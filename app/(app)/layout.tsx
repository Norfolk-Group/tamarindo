export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen copilot: the shell (rail, header, canvas) lives in the
  // Copilot component so every surface stays a caller of the same core.
  return <>{children}</>;
}
