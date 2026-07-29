import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrica personalizada para registrar errores
const errorRate = new Rate('errors');

// Configuración del Escenario de Carga y SLAs
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp-up: subir a 10 usuarios en 10s
    { duration: '30s', target: 10 }, // Carga constante: mantener 10 usuarios durante 30s
    { duration: '10s', target: 0 },  // Ramp-down: bajar a 0 usuarios
  ],
  thresholds: {
    // SLO 1: El 95% de las peticiones debe responder en menos de 200ms
    http_req_duration: ['p(95)<200'],
    // SLO 2: La tasa de errores debe ser menor al 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3001';

export default function () {
  const payload = JSON.stringify({
    userId: `usr_perf_${__VU}_${__ITER}`,
    items: [
      { id: 'prod_k6', name: 'Performance Test Product', price: 1500 }
    ],
    amount: 1500,
    cardNumber: '4532000000001111' // Tarjeta aprobada en WireMock
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Petición POST al Order Service
  const res = http.post(`${BASE_URL}/api/v1/orders`, payload, params);

  // Validaciones (Assertions)
  const success = check(res, {
    'Status es 201 Created': (r) => r.status === 201,
    'Transacción tiene ID': (r) => {
      if (r.status === 201) {
        const body = JSON.parse(r.body);
        return body.paymentTransactionId !== undefined;
      }
      return false;
    },
  });

  // Si la validación falla, registra el error
  errorRate.add(!success);

  // Pausa entre iteraciones para simular comportamiento humano (Think Time)
  sleep(1);
}
