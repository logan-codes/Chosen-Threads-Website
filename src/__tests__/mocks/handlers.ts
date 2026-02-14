import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
  
  http.get('/api/products', () => {
    return HttpResponse.json({
      products: [
        { id: 1, name: 'Test Product', price: 29.99, category: 'Apparel' }
      ]
    });
  }),
  
  http.get('/api/product-config.json', () => {
    return HttpResponse.json({
      svgs: {
        FRONT: [],
        BACK: [],
        LEFT: [],
        RIGHT: []
      },
      designAreas: {
        FRONT: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
        BACK: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
        LEFT: { x: 0.15, y: 0.3, width: 0.35, height: 0.3 },
        RIGHT: { x: 0.5, y: 0.3, width: 0.35, height: 0.3 }
      }
    });
  })
];
