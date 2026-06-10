import AppFooter from "@/components/layout/AppFooter";

export default function AppShell({ children }) {
  return (
    <div className="h-dvh overflow-hidden bg-[#f7f7f2] p-5 text-[#0d0d0c] sm:p-8">
      <div className="grid h-full min-h-0 w-full grid-rows-[1fr_auto] gap-4">
        <main className="flex min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
