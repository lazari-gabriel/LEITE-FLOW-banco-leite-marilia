# Arquitetura do Sistema — BLH Marília

O sistema de **Gestão e Logística de Coleta Domiciliar de Leite Materno** foi concebido sob princípios de arquitetura limpa, desacoplamento por camadas e design modular.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma divisão estrita de responsabilidades:

```
[ Camada de Apresentação (UI & Componentes) ]
                    ↓
[ Camada de Estado Global (React Context & Hooks) ]
                    ↓
[ Camada de Serviços e Domínio (Services & Logic) ]
                    ↓
[ Camada de Dados & Persistência (Mock / REST API / SQLite) ]
```

### Componentes Chave:
- **Presentation Layer (`src/components`)**:
  - `ui/`: Átomos e moléculas do Design System (`Button`, `Badge`, `StatCard`, `Modal`, `Toast`, `EmptyState`).
  - `layout/`: `AppShell`, `Sidebar` responsiva colapsável e `Header` com relógio em tempo real.
  - `modules/`: Telas funcionais especializadas (`dashboard`, `doadoras`, `roteirizacao`, `mapa`, `etiquetas`, `accountability`).
- **State Management Layer (`src/context`, `src/hooks`)**:
  - `AppContext`: Ponto único da verdade com reatividade, cálculos de estatísticas globais e sistema de toasts.
- **Business Domain Services (`src/services`)**:
  - `donorService.ts`: Validações sanitárias da ANVISA, motor Go/No-Go e classificação biológica (Colostro, Transição, Maduro).
  - `bottleService.ts`: Gestão da entidade Frasco, cálculo da validade de 15 dias para leite cru congelado e inventário.
  - `routeService.ts`: Algoritmo de roteirização TSP Nearest Neighbor a partir do Hospital Materno Infantil, métricas de tempo e distância viária, e gerador de turn-by-turn para Google Maps.
  - `labelService.ts`: Renderização vetorial estrita SVG para Code128 e QR Code para impressoras térmicas (60x40mm) e convencionais.

---

## 2. Padrões Adotados
- **Single Responsibility Principle (SRP)**: Cada componente e serviço realiza apenas sua função estrita.
- **Adapter Pattern para Serviços Geográficos**: O `routeService` e `InteractiveMapView` isolam o Leaflet e o Google Maps, permitindo futura troca por Mapbox ou OSRM sem impacto na UI.
- **Fail-Safe Sanitário**: As regras médicas impedem estados inconsistentes em tempo de execução através do TypeScript.
