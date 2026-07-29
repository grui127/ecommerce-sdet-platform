import { test, expect } from '@playwright/test';

test.describe('Integración con WireMock - Pasarela de Pagos', () => {
  
  test('Debería procesar un pago exitoso con tarjeta válida', async ({ request }) => {
    const response = await request.post('/api/v1/payments/charge', {
      data: {
        amount: 1500,
        cardNumber: '4532000000001111'
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('APPROVED');
    expect(body.transactionId).toBeDefined();
  });

  test('Debería rechazar el pago cuando la tarjeta no tiene fondos suficientes', async ({ request }) => {
    const response = await request.post('/api/v1/payments/charge', {
      data: {
        amount: 50000,
        cardNumber: '4532000000009999' // Tarjeta configurada para rechazo
      }
    });

    // Validamos el status de error HTTP 400
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.status).toBe('DECLINED');
    expect(body.errorCode).toBe('INSUFFICIENT_FUNDS');
    expect(body.message).toContain('saldo insuficiente');
  });

});