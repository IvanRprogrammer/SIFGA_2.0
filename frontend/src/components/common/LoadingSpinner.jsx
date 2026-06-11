const LoadingSpinner = ({ text = 'Cargando...' }) => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <div className="text-center">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <div className="text-muted small">{text}</div>
    </div>
  </div>
);

export default LoadingSpinner;
