import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import axios from 'axios';

const { like, string } = MatchersV3;

// Configuración del Mock Server de Pact
const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'PaymentService',
  dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
});

describe('Contrato entre OrderService (Consumer) y PaymentService (Provider)', () => {

  it('Debería recibir una respuesta exitosa cuando el cobro es aprobado', async () => {
    // 1. Definición del Contrato (Expectativa)
    provider
      .given('Exista saldo suficiente para la tarjeta')
      .uponReceiving('Petición de cobro de orden')
      .withRequest({
        method: 'POST',
        path: '/api/v1/payments/charge',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          amount: like(1500),
          cardNumber: like('4532000000001111'),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          status: string('APPROVED'),
          transactionId: string('tx_mock_12345'),
        },
      });

    // 2. Ejecución de la prueba sobre el servidor mock de Pact
    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(`${mockServer.url}/api/v1/payments/charge`, {
        amount: 1500,
        cardNumber: '4532000000001111',
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('APPROVED');
    });
  });

});
