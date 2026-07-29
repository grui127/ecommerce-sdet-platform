import { test, expect } from '@playwright/test';

test.describe('Flujo de Creación de Órdenes (Order Service -> Payment WireMock)', () => {

  const ORDER_SERVICE_URL = 'http://localhost:3001';

  test('Debería crear una orden exitosamente cuando el pago es aprobado', async ({ request }) => {
    const response = await request.post(`${ORDER_SERVICE_URL}/api/v1/orders`, {
      data: {
        userId: 'usr_gaston_123',
        items: [{ id: 'prod_1', name: 'Mouse Gamer', price: 1500 }],
        amount: 1500,
        cardNumber: '4532000000001111' // Tarjeta que aprueba en WireMock
      }
    });

    expect(response.status()).toBe(201);
    const order = await response.json();

    expect(order.orderId).toContain('ord_');
    expect(order.status).toBe('COMPLETED');
    expect(order.paymentTransactionId).toBeDefined();
  });

  test('Debería rechazar la orden cuando la tarjeta no tiene fondos', async ({ request }) => {
    const response = await request.post(`${ORDER_SERVICE_URL}/api/v1/orders`, {
      data: {
        userId: 'usr_gaston_123',
        items: [{ id: 'prod_2', name: 'Teclado Mecánico', price: 50000 }],
        amount: 50000,
        cardNumber: '4532000000009999' // Tarjeta que rechaza en WireMock
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();

    expect(result.order.status).toBe('PAYMENT_FAILED');
    expect(result.order.errorDetails.errorCode).toBe('INSUFFICIENT_FUNDS');
  });

});
