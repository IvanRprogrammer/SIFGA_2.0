import { useState, useCallback } from 'react';
import api from '../services/api';

export function useApi(serviceMethod) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceMethod(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error desconocido';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [serviceMethod]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.get(url, { params });
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error de conexión';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, execute };
}
