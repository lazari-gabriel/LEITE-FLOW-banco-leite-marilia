# LEITE FLOW — Logística & Gestão de Coleta de Leite Materno

[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)](https://leafletjs.com/)

> Sistema corporativo e de campo para roteirização urbana, triagem clínica, coleta domiciliar e rastreabilidade total de frascos de leite materno em **Marília - SP** para o **Hospital Materno Infantil**.

---

## 🌟 O que é o LEITE FLOW?

O **LEITE FLOW** é uma solução pensada para garantir uma experiência de uso extremamente simples, intuitiva e à prova de falhas para os coletores em campo e para a coordenação do Banco de Leite Humano. 

O sistema guia o usuário passo a passo através de um fluxo claro:
```
ROTA (Região) ➔ PRÓXIMA PARADA ➔ [ IR PARA A PARADA ] ➔ [ CHEGUEI ] ➔ REGISTRAR COLETA ➔ ETIQUETA DO FRASCO ➔ CONFIRMAR ➔ ✓ COLETA CONCLUÍDA ➔ PRÓXIMA
```

---

## 🎯 Principais Funcionalidades

### 1. Central de Rotas de Campo
- **Zoneamento Semanal de Marília**:
  - Segunda-feira: Zona Norte
  - Terça-feira: Zona Sul
  - Quarta-feira: Zona Oeste
  - Quinta-feira: Zona Leste
  - Sexta-feira: Zona Rural e Maracá
- **Origem e Retorno Transparentes**: Partida e encerramento no Hospital Materno Infantil.
- **Card de Próxima Parada**: Destaca o próximo endereço com distância, tempo estimado e ações diretas:
  - `[ IR PARA A PARADA ]` (Abre o GPS no Google Maps)
  - `[ CHEGUEI ]` (Botão de toque imediato ao chegar no endereço)
- **Barra de Progresso Simples**: Visualização direta de quantas paradas foram concluídas e quantas faltam.
- **Botão "Melhorar Rota"**: Algoritmo que reorganiza as paradas por menor distância geométrica a partir do hospital.

### 2. Registro de Coleta Rápido e Sem Digitação Repetitiva
- Ao clicar em `[ CHEGUEI ]`, o sistema abre a ficha de coleta com todos os dados da mãe, bebê, endereço, data e hora já preenchidos.
- O coletor informa apenas:
  - **Volume em mL** (com botões de seleção rápida de 100, 150, 200, 250 ou 300 mL).
  - **Temperatura da caixa térmica** (alerta automático se estiver acima de -10°C).
  - Frascos vazios esterilizados entregues.

### 3. Etiquetas com Padrão Oficial do Banco de Leite
- Código identificador único: `LF-2026-XXXXXX` (ex: `LF-2026-000123`).
- 3 Modelos padronizados de acordo com as normas da ANVISA e BLH Marília:
  1. **Visual 1: Etiqueta Inicial (Coleta Domiciliar - Cru)**: Nome da doadora, data de nascimento do bebê, data/hora da primeira coleta (início da validade de 15 dias), volume e temperatura.
  2. **Visual 2: Rótulo de Estocagem & Classificação**: Forma de extração, pré-estocagem residencial e classificação do leite (Colostro, Transição ou Maduro).
  3. **Visual 3: Nova Identidade Hospitalar (Pasteurização UTI)**: Doadora anonimizada para sigilo médico, controle de qualidade (Acidez Dornic e Crematócrito) e leito receptor.
- Código de barras óptico (Code128) e QR Code vetoriais em alta resolução para impressoras térmicas (60x40mm) e folha A4.

### 4. Mapa Despoluído e Otimizado
- Mapa com traçado de rota limpo, focado nas paradas do dia.
- Marcadores sincronizados com a lista: 🔵 Próxima, 🟢 Concluída, ⚪ Pendente.
- Painel flutuante com distância total em km, tempo estimado e atalhos rápidos.

### 5. Triagem e Funil Go / No-Go
- Wizard de 5 etapas com validação da Regra de Ouro (sorologia, tabagismo e carência de 12 meses para tatuagens).
- Classificação biológica automática por dias pós-parto:
  - Colostro: 1º ao 7º dia
  - Transição: 8º ao 14º dia
  - Maduro: 15º dia em diante

---

## 🚀 Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build

# 4. Visualizar build compilado localmente
npm run preview
```

O sistema estará acessível em: `http://localhost:3000`
