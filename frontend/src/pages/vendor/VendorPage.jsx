import { useState } from 'react';
import VendorDashboard from './VendorDashboard';
import VendorClients from './VendorClients';
import ProposeClient from './ProposeClient';
import TakeReading from './TakeReading';
import VendorInvoiceSearch from './VendorInvoiceSearch';
import VendorRecaudos from './VendorRecaudos';
import VendorFacturacion from './VendorFacturacion';

const VendorPage = () => {
  const [section, setSection] = useState('dashboard');

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <VendorDashboard onNavigate={setSection} />;
      case 'clientes': return <VendorClients onNavigate={setSection} />;
      case 'proponer': return <ProposeClient onNavigate={setSection} />;
      case 'lectura': return <TakeReading onNavigate={setSection} />;
      case 'facturacion': return <VendorFacturacion onNavigate={setSection} />;
      case 'consulta': return <VendorInvoiceSearch onNavigate={setSection} />;
      case 'recaudos': return <VendorRecaudos onNavigate={setSection} />;
      default: return <VendorDashboard onNavigate={setSection} />;
    }
  };

  return renderSection();
};

export default VendorPage;
