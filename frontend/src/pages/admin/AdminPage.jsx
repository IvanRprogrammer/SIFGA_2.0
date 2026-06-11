import { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ClientesPage from './ClientesPage';
import PendingProposals from './PendingProposals';
import AdminConfig from './AdminConfig';
import AdminRecaudos from './AdminRecaudos';
import AdminReports from './AdminReports';
import AuditLogPage from './AuditLogPage';

const AdminPage = () => {
  const [section, setSection] = useState('dashboard');

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <AdminDashboard onNavigate={setSection} />;
      case 'usuarios': return <UserManagement onNavigate={setSection} />;
      case 'clientes': return <ClientesPage onNavigate={setSection} />;
      case 'aprobar': return <PendingProposals onNavigate={setSection} />;
      case 'configuracion': return <AdminConfig onNavigate={setSection} />;
      case 'recaudos': return <AdminRecaudos onNavigate={setSection} />;
      case 'reportes': return <AdminReports onNavigate={setSection} />;
      case 'auditoria': return <AuditLogPage onNavigate={setSection} />;
      default: return <AdminDashboard onNavigate={setSection} />;
    }
  };

  return renderSection();
};

export default AdminPage;
