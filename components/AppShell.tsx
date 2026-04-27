import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
