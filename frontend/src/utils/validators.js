export function required(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} es requerido`;
  }
  return null;
}

export function isEmail(value) {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) {
    return 'Correo electrónico inválido';
  }
  return null;
}

export function isNumeric(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  if (isNaN(Number(value))) {
    return `${fieldName} debe ser un número`;
  }
  return null;
}

export function minLength(value, min, fieldName) {
  if (!value) return null;
  if (value.length < min) {
    return `${fieldName} debe tener al menos ${min} caracteres`;
  }
  return null;
}

export function validateForm(values, rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
