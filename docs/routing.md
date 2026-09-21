# Logística e Roteirização Urbana — Marília - SP

A logística do Banco de Leite Humano de Marília é estruturada no zoneamento setorial por dias úteis, otimizando o deslocamento da van coletora e garantindo o recolhimento sistemático do leite dentro do prazo seguro de 15 dias.

---

## 1. Zoneamento Semanal de Marília

| Dia da Semana | Zona Logística | Bairros Atendidos | Cor Temática |
|---|---|---|---|
| **Segunda-feira** | Zona Norte | Palmital, Santa Antonieta, Jd. Cavalari, Jd. Primavera | `#235347` (Verde Principal) |
| **Terça-feira** | Zona Sul | Nova Marília, Costa e Silva, Jóquei Clube, Teotônio Vilela | `#b87d28` (Âmbar) |
| **Quarta-feira** | Zona Oeste | Maria Izabel, Alto Cafezal, Jd. Califórnia, Polon | `#357262` (Verde Claro) |
| **Quinta-feira** | Zona Leste | Cascata, Fragata, Aeroporto, Jd. Esmeralda | `#cf6656` (Coral) |
| **Sexta-feira** | Zona Rural | Distrito de Maracá, Padre Nóbrega, Avencas, Rosália | `#496374` (Azul-Cinza) |

---

## 2. Ponto Central de Partida e Retorno
- **Hospital Materno Infantil de Marília**
- Coordenadas GPS: `[-22.21735, -49.94692]`
- Todas as rotas iniciam e encerram na câmara fria central do BLH para descarregamento imediato nas caixas de inspeção.

---

## 3. Algoritmo de Otimização (Nearest Neighbor TSP)
Para reduzir o tempo de trânsito em que o frasco permanece na caixa térmica, o sistema disponibiliza o algoritmo do **Vizinho Mais Próximo**:
1. O ponto de partida é fixado nas coordenadas da sede do BLH.
2. A cada iteração, o sistema calcula a distância geodésica (fórmula de Haversine) entre a posição atual e todos os pontos pendentes da zona.
3. A parada mais próxima é selecionada e se torna o novo ponto de referência.
4. O processo se repete até esgotar as doadoras do dia, reordenando a lista e atualizando o traçado no mapa e o link de GPS do Google Maps.
