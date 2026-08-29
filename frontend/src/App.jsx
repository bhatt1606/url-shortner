import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import CreateUrl from "./pages/CreateUrl.jsx";
import Explorer from "./pages/Explorer.jsx";
import SystemDashboard from "./pages/SystemDashboard.jsx";

export default function App() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<CreateUrl />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/system" element={<SystemDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
