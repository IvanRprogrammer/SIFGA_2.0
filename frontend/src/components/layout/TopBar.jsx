const TopBar = ({ title, onToggleSidebar }) => {
  return (
    <div className="top-bar">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-sm d-md-none" onClick={onToggleSidebar}>
          <i className="bi bi-list fs-4"></i>
        </button>
        <h5 className="mb-0" style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{title}</h5>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">
          <i className="bi bi-calendar3 me-1"></i>
          {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

export default TopBar;
