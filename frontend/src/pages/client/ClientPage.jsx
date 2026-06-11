import { useState } from 'react';
import ClientDashboard from './ClientDashboard';
import ClientFacturas from './ClientFacturas';
import ClientPay from './ClientPay';
import ClientConsumption from './ClientConsumption';
import ClientPayments from './ClientPayments';

const ClientPage = () => {
  const [section, setSection] = useState('cuenta');

  const renderSection = () => {
    switch (section) {
      case 'cuenta': return <ClientDashboard onNavigate={setSection} />;
      case 'facturas': return <ClientFacturas onNavigate={setSection} />;
      case 'pagar': return <ClientPay onNavigate={setSection} />;
      case 'historial': return <ClientConsumption onNavigate={setSection} />;
      case 'pagos': return <ClientPayments onNavigate={setSection} />;
      default: return <ClientDashboard onNavigate={setSection} />;
    }
  };

  return renderSection();
};

export default ClientPage;
