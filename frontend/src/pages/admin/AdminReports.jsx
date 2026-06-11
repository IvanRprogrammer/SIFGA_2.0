import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { getMonthlyReport, getAnnualReport } from '../../services/reporteService';
import { toast } from 'react-toastify';

const AdminReports = ({ onNavigate }) => {
  const [report, setReport] = useState(null);
  const [type, setType] = useState('monthly');
  const [period, setPeriod] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = type === 'monthly'
        ? await getMonthlyReport(period.anio, period.mes)
        : await getAnnualReport(period.anio);
      setReport(data);
    } catch { toast.error('Error al generar reporte'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Reportes" activeSection="reportes" onNavigate={onNavigate}>
      <div className="filters-bar">
        <select className="form-select form-select-sm" style={{ width: 'auto' }} value={type}
          onChange={e => setType(e.target.value)}>
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
          <input type="number" className="form-control form-control-sm" style={{ width: '100px' }}
            value={period.anio} onChange={e => setPeriod(p => ({ ...p, anio: parseInt(e.target.value) || 2026 }))} />
          {type === 'monthly' && (
            <input type="number" className="form-control form-control-sm" style={{ width: '80px' }} min="1" max="12"
              value={period.mes} onChange={e => setPeriod(p => ({ ...p, mes: parseInt(e.target.value) || 1 }))} />
        )}
        <button className="btn btn-sm btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Generando...' : <><i className="bi bi-file-earmark-bar-graph me-1"></i> Generar Reporte</>}
        </button>
      </div>

      {report && (
        <div className="row g-3">
          {type === 'monthly' ? (
            <>
              <div className="col-12">
                <div className="form-card">
                  <h5>Reporte Mensual: {report.periodo}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-label">Ingresos</div>
                  <div className="stat-value small">${Number(report.ingresos.total_ingresos).toLocaleString('es-CO')}</div>
                  <small>{report.ingresos.total_pagos} pagos</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-label">Facturas Emitidas</div>
                  <div className="stat-value small">{report.facturas.total}</div>
                  <small>$ {Number(report.facturas.monto_total).toLocaleString('es-CO')}</small>
                </div>
              </div>
              <div className="col-12">
                <div className="form-card">
                  <h6>Facturas por Estado</h6>
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Estado</th><th>Cantidad</th><th>Monto</th></tr></thead>
                      <tbody>
                        {report.por_estado.map((e, i) => (
                          <tr key={i}><td><StatusBadge status={e.estado} /></td><td>{e.cantidad}</td><td>${Number(e.monto).toLocaleString('es-CO')}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {report.por_estrato?.length > 0 && (
                <div className="col-12">
                  <div className="form-card">
                    <h6>Distribución por Estrato</h6>
                    <div className="table-responsive">
                      <table className="table">
                        <thead><tr><th>Estrato</th><th>Clientes</th><th>Facturas</th><th>Monto</th></tr></thead>
                        <tbody>
                          {report.por_estrato.map((e, i) => (
                            <tr key={i}><td>{e.estrato}</td><td>{e.clientes}</td><td>{e.facturas}</td><td>${Number(e.monto).toLocaleString('es-CO')}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="col-12">
                <div className="form-card">
                  <h5>Reporte Anual: {report.anio}</h5>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-card">
                  <h6>Ingresos Mensuales</h6>
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Mes</th><th>Ingresos</th><th>Facturas</th><th>Monto</th></tr></thead>
                      <tbody>
                        {report.ingresos_mensuales.map((r, i) => {
                          const fm = report.facturas_mensuales?.find(f => f.mes === r.mes);
                          const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                          return (
                            <tr key={i}>
                              <td>{meses[r.mes - 1]}</td>
                              <td>${Number(r.total).toLocaleString('es-CO')}</td>
                              <td>{fm?.emitidas || 0}</td>
                              <td>${Number(fm?.monto || 0).toLocaleString('es-CO')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-card">
                  <h6>Indicadores</h6>
                  <div className="mb-2"><strong>Morosidad:</strong> ${Number(report.morosidad).toLocaleString('es-CO')}</div>
                  <div className="mb-2"><strong>Cartera Total:</strong> ${Number(report.cartera_total).toLocaleString('es-CO')}</div>
                  {report.top_deudores?.length > 0 && (
                    <>
                      <h6 className="mt-3">Top Deudores</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead><tr><th>Cliente</th><th>Cédula</th><th>Deuda</th></tr></thead>
                          <tbody>
                            {report.top_deudores.map((d, i) => (
                              <tr key={i}><td>{d.nombres} {d.apellidos}</td><td>{d.cedula}</td><td>${Number(d.deuda_actual).toLocaleString('es-CO')}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminReports;
