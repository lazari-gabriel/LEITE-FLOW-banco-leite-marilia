import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';

const geocodeSchema = z.object({
  address: z.string().trim().min(3),
  city: z.string().trim().default('Marília'),
  state: z.string().trim().default('SP'),
});

// Cache simples em memória para evitar chamadas repetidas ao Nominatim
const geocodeCache = new Map<string, { lat: number; lng: number; displayName: string }>();

export async function geoRoutes(app: FastifyInstance) {
  app.post(
    '/geo/geocode',
    {
      preHandler: [authenticate],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        tags: ['Geolocalização'],
        summary: 'Geocodificar endereço em Marília - SP via Nominatim (OSM) com cache',
      },
    },
    async (request, reply) => {
      const parsed = geocodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ title: 'Endereço inválido', status: 400 });
      }

      const { address, city, state } = parsed.data;
      const fullQuery = `${address}, ${city}, ${state}, Brasil`;
      const cacheKey = fullQuery.toLowerCase();

      const cached = geocodeCache.get(cacheKey);
      if (cached) {
        return reply.send({ found: true, geocodeStatus: 'verified', ...cached });
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(fullQuery)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'LeiteFlow-BLH-Marilia/1.0 (hospital-materno-infantil)',
            'Accept-Language': 'pt-BR,pt',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          return reply.send({
            found: false,
            geocodeStatus: 'failed',
            detail: 'Serviço de geocodificação indisponível no momento.',
          });
        }

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;

        if (!results || results.length === 0) {
          return reply.send({
            found: false,
            geocodeStatus: 'failed',
            detail: 'Endereço não localizado exatamente no mapa. Será usada coordenada aproximada da zona.',
          });
        }

        const lat = Number(Number(results[0].lat).toFixed(6));
        const lng = Number(Number(results[0].lon).toFixed(6));
        const displayName = results[0].display_name;

        // Valida bounding box ampla de Marília e distritos (-22.45..-21.95, -50.25..-49.70)
        const inMariliaRegion = lat >= -22.5 && lat <= -21.9 && lng >= -50.3 && lng <= -49.65;
        if (!inMariliaRegion) {
          return reply.send({
            found: false,
            geocodeStatus: 'failed',
            detail: 'O endereço localizado está fora da área de cobertura de Marília - SP.',
          });
        }

        const result = { lat, lng, displayName };
        geocodeCache.set(cacheKey, result);
        return reply.send({ found: true, geocodeStatus: 'verified', ...result });
      } catch {
        return reply.send({
          found: false,
          geocodeStatus: 'failed',
          detail: 'Tempo esgotado ao consultar coordenadas do endereço.',
        });
      }
    }
  );
}
