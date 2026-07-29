const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8080';

const orders = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'order-service' });
});

// Crear Orden
app.post('/api/v1/orders', async (req, res) => {
  const { userId, items, amount, cardNumber } = req.body;

  if (!items || !amount || !cardNumber) {
    return res.status(400).json({ error: 'Faltan campos requeridos: items, amount, cardNumber' });
  }

  const orderId = `ord_${Date.now()}`;

  try {
    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/v1/payments/charge`, {
      amount,
      cardNumber
    });

    const newOrder = {
      orderId,
      userId: userId || 'usr_guest',
      items,
      amount,
      status: 'COMPLETED',
      paymentTransactionId: paymentResponse.data.transactionId,
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    return res.status(201).json(newOrder);

  } catch (error) {
    if (error.response && error.response.data) {
      const failedOrder = {
        orderId,
        userId: userId || 'usr_guest',
        items,
        amount,
        status: 'PAYMENT_FAILED',
        errorDetails: error.response.data,
        createdAt: new Date().toISOString()
      };
      orders.push(failedOrder);
      return res.status(400).json({
        message: 'No se pudo procesar la orden debido a un fallo en el pago.',
        order: failedOrder
      });
    }

    return res.status(500).json({
      error: 'Error interno o de conexión con el servicio de pagos',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Order Service corriendo en http://localhost:${PORT}`);
  console.log(`💳 Usando Payment Service en: ${PAYMENT_SERVICE_URL}`);
});
