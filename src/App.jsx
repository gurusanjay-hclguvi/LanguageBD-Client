import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useRole } from './context/RoleContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import MyQueue from './pages/MyQueue.jsx';
import Import from './pages/Import.jsx';
import Analytics from './pages/Analytics.jsx';
import Team from './pages/Team.jsx';

/** Ops-only pages send a BD back to their queue. */
function AdminOnly({ children }) {
  const { isAdmin } = useRole();
  return isAdmin ? children : <Navigate to="/queue" replace />;
}

export default function App() {
  const { isAdmin } = useRole();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/queue" replace />} />
        <Route path="/leads" element={<AdminOnly><Leads /></AdminOnly>} />
        <Route path="/import" element={<AdminOnly><Import /></AdminOnly>} />
        <Route path="/impact" element={<AdminOnly><Analytics /></AdminOnly>} />
        <Route path="/team" element={<AdminOnly><Team /></AdminOnly>} />
        <Route path="/queue" element={<MyQueue />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
