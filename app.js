const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

let userCounter = 1;
const clients = new Map();

const financialData = {
  '2023': { revenue: 150000, expenses: 120000 },
  '2024': { revenue: 100000, expenses: 130000 }
};

function calculateYearlyResults(data) {
  const results = {};
  for (const year in data) {
    const { revenue, expenses } = data[year];
    const profit = revenue - expenses;
    const status = profit >= 0 ? 'прибуток' : 'збиток';
    results[year] = { revenue, expenses, profit, status };
  }
  return results;
}

const yearlyResults = calculateYearlyResults(financialData);

wss.on('connection', function connection(ws) {
  const username = `Користувач ${userCounter++}`;
  clients.set(ws, username);

  ws.send(JSON.stringify({ type: 'system', text: `Ви підключились як ${username}` }));

  for (const year in yearlyResults) {
    const res = yearlyResults[year];
    ws.send(JSON.stringify({ type: 'system-result', text: `Рік: ${year}` }));
    ws.send(JSON.stringify({ type: 'system-result', text: `Дохід: ${res.revenue} грн` }));
    ws.send(JSON.stringify({ type: 'system-result', text: `Витрати: ${res.expenses} грн` }));
    ws.send(JSON.stringify({ type: 'system-result', text: `Результат: ${res.status.toUpperCase()} на суму ${Math.abs(res.profit)} грн` }));
  }

  ws.on('message', function incoming(message) {
    const name = clients.get(ws) || 'Користувач';
    const formatted = JSON.stringify({ type: 'user', text: `${name}: ${message.toString()}` });

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(formatted);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
});
