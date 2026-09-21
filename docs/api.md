# Especificação da API REST — BLH Marília

O frontend atual opera com um mock service reativo tipado, estruturado para consumir diretamente a API REST correspondente.

---

## 1. Endpoints Padronizados

### Doadoras (`/api/doadoras`)
- `GET /api/doadoras`: Lista todas as doadoras com filtros opcionais (`zona`, `status`, `search`).
- `GET /api/doadoras/:id`: Retorna detalhes clínicos e histórico de coletas de uma doadora.
- `POST /api/doadoras`: Submete formulário de triagem, executa o motor Go/No-Go e persiste a doadora.
- `PATCH /api/doadoras/:id/status`: Atualiza o veredito da doadora mediante novo laudo sorológico.

### Coletas e Frascos (`/api/frascos`)
- `GET /api/frascos`: Lista os frascos coletados e seus status de pasteurização.
- `POST /api/frascos`: Registra a coleta de campo, vincula à doadora e gera a identificação única.
- `PATCH /api/frascos/:id/laudo`: Registra a acidez Dornic e o crematócrito após recepção no laboratório do BLH.
- `PATCH /api/frascos/:id/dispensacao`: Registra o envio ao leito da UTI Neonatal com anonimização.

### Roteirização Urbana (`/api/rotas`)
- `GET /api/rotas/:dia`: Retorna as paradas programadas para o dia da semana na zona de Marília.
- `POST /api/rotas/:dia/otimizar`: Executa o algoritmo de menor distância geométrica (TSP Nearest Neighbor) a partir da sede do Hospital Materno Infantil.
