import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { mockMarketTrends, mockCompetitorPrices, mockMarketEvents } from '../components/Game/__mocks__/marketData';

export const handlers = [
  rest.get('http://localhost:3000/api/market/trends', (_req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json(mockMarketTrends)
    );
  }),

  rest.get('http://localhost:3000/api/market/competitor-prices', (_req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json(mockCompetitorPrices)
    );
  }),

  rest.get('http://localhost:3000/api/market/events', (_req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json(mockMarketEvents)
    );
  }),

  rest.post('http://localhost:3000/api/market/events', (_req, res, ctx) => {
    const newEvent = {
      id: 'new-event',
      type: 'price_change',
      severity: 'medium',
      description: 'New market price fluctuation',
      affectedMedications: ['aspirin'],
      impact: {
        priceChange: 0.1,
        supplyChange: 0,
        demandChange: 0
      },
      duration: 7,
      startDate: new Date().toISOString()
    };
    return res(
      ctx.delay(100),
      ctx.json(newEvent)
    );
  })
];

export const server = setupServer(...handlers); 