import { Outlet, useLocation } from "react-router-dom";
import TopNav from "@/components/marea/TopNav";
import ContactSection from "@/components/marea/ContactSection";

// Layout for the main catalog screens (catalog + saved). Product detail and
// admin forms render standalone with their own navigation.
export default function MareaLayout() {
  const location = useLocation();
  const onSaved = location.pathname === "/saved";
  return (
    <div className="min-h-screen bg-parchment">
      <TopNav />
      <main className="pt-14">
        <Outlet />
      </main>
      <ContactSection delivery={onSaved} />
    </div>
  );
}