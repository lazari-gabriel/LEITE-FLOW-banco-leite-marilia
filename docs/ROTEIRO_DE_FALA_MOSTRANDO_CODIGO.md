# 🎙️ Roteiro de Fala Passo a Passo (Para Ler Mostrando o Código)
### Apresentação Técnica — Sistema LEITE FLOW (Hospital Materno Infantil de Marília)

> **Como usar este roteiro:** 
> Deixe este arquivo aberto em uma metade da tela (ou no celular) e o VS Code na outra metade.
> Basta abrir os arquivos indicados e ler os textos marcados em **"O QUE LER NA HORA"**. Cada fala dura entre 20 e 40 segundos.

---

## 🎬 1. ABERTURA (Antes de abrir o código — 20 segundos)

### 🗣️ O QUE LER NA HORA:
> *"Olá a todos. O LEITE FLOW é o sistema desenvolvido para modernizar e digitalizar a logística de coleta de leite materno do Banco de Leite Humano do Hospital Materno Infantil de Marília.*
> 
> *Para mostrar como o sistema foi construído, vou abrir os principais arquivos do código e explicar a lógica por trás de cada um."*

---

## 🧠 2. O CÉREBRO DO SISTEMA
### 📂 Arquivo para abrir no VS Code: `src/context/AppContext.tsx`
* **Onde apontar com o mouse:** Linhas onde ficam declaradas as variáveis de estado (`donors`, `routes`, `bottles`, `routeAssignment`) e as funções de ação (`handleArrivalAtStop`, `activateRoute`, `finishRoute`).

### 🗣️ O QUE LER NA HORA:
> *"Começando pelo arquivo mais importante da aplicação: o `AppContext.tsx`.*
> 
> *Ele funciona como a memória central compartilhada do sistema. É aqui que ficam sincronizados em tempo real todos os dados da operação: as mães doadoras cadastradas, as rotas ativas do dia e cada frasco de leite coletado.*
> 
> *Usamos a Context API do React para garantir que, quando o motorista da van registra uma coleta na rua, o mapa, a lista de paradas e o painel da chefia atualizem no mesmo milissegundo, sem perigo de informações desencontradas."*

---

## 🛣️ 3. A INTELIGÊNCIA LOGÍSTICA & O GPS
### 📂 Arquivo para abrir no VS Code: `src/services/routeService.ts`
* **Onde apontar com o mouse:**
  1. Função `calculateHaversineKm`
  2. Função `optimizeStopsNearestNeighbor`
  3. Função `fetchDrivingRouteGeometry`

### 🗣️ O QUE LER NA HORA:
> *"Passando para a parte de logística e trânsito, temos o `routeService.ts`.*
> 
> *Aqui temos três funções fundamentais:*
> 
> *Primeiro, a função `calculateHaversineKm`, que calcula a distância real em linha geodésica considerando a curvatura da Terra, com um fator viário calibrado para o trânsito urbano de Marília.*
> 
> *Segundo, a função `optimizeStopsNearestNeighbor`, que aplica o algoritmo do 'Vizinho Mais Próximo'. Ela reordena automaticamente as casas da doadora mais perto para a mais distante partindo do Materno Infantil, economizando combustível e tempo da van.*
> 
> *E terceiro, a função `fetchDrivingRouteGeometry`, que se conecta com o motor viário OSRM. É ela quem substitui linhas retas pelo traçado real que acompanha as curvas, avenidas e esquinas das ruas de Marília."*

---

## 🩺 4. A TRIAGEM MÉDICA & CRITÉRIOS ANVISA
### 📂 Arquivo para abrir no VS Code: `src/services/donorService.ts`
* **Onde apontar com o mouse:**
  1. Função `evaluateGoNoGo`
  2. Função `calculateMilkClass`

### 🗣️ O QUE LER NA HORA:
> *"Agora na parte de segurança médica e sanitária, temos o `donorService.ts`.*
> 
> *A função `evaluateGoNoGo` automatiza os critérios de triagem da ANVISA e do Ministério da Saúde. Se a mãe tiver qualquer exame sorológico alterado (como HIV, Hepatite ou Sífilis) ou contraindicação médica, o sistema bloqueia a coleta na hora com veredito 'Inapta'.*
> 
> *Já a função `calculateMilkClass` classifica o leite com base na data do parto: Colostro até o 7º dia, Leite de Transição até o 15º dia e Leite Maduro a partir do 16º dia. Isso garante que a UTI Neonatal saiba exatamente a composição nutricional do leite para prescrever ao prematuro correto."*

---

## 🏷️ 5. AS ETIQUETAS TÉRMICAS E GERAÇÃO OFFLINE
### 📂 Arquivo para abrir no VS Code: `src/services/labelService.ts`
* **Onde apontar com o mouse:** Funções `generateBarcodeSvgElements` e `generateQrCodeSvgPath`.

### 🗣️ O QUE LER NA HORA:
> *"No `labelService.ts`, resolvemos um desafio crítico de campo: como imprimir etiquetas mesmo se a van estiver num bairro ou distrito rural sem sinal de internet 4G?*
> 
> *Em vez de depender de servidores externos, nós geramos o Código de Barras padrão Code 128 e o QR Code diretamente em código matemático SVG puro dentro do próprio navegador.*
> 
> *Isso permite que a impressora térmica hospitalar imprima a etiqueta de 60 por 40 milímetros instantaneamente e 100% offline."*

---

## 🗺️ 6. O MAPA INTERATIVO & SELETOR DE CAMADAS
### 📂 Arquivo para abrir no VS Code: `src/components/modules/mapa/InteractiveMapView.tsx`
* **Onde apontar com o mouse:** A constante `MAP_PROVIDERS` (linhas 30-60) e o trecho onde o `L.polyline` é desenhado com camada dupla (halo branco + traçado verde).

### 🗣️ O QUE LER NA HORA:
> *"Entrando nos componentes visuais, este é o `InteractiveMapView.tsx`.*
> 
> *Aqui integramos o Leaflet com provedores totalmente abertos e gratuitos: OpenStreetMap padrão, Ruas em alta definição e imagem de Satélite da Esri, sem depender de chaves pagas que bloqueavam o mapa antigamente.*
> 
> *E para desenhar o caminho na tela, criamos uma renderização em camada dupla: uma borda branca de contraste e uma linha verde esmeralda por cima, garantindo visibilidade clara tanto no mapa de ruas quanto na foto de satélite."*

---

## 📱 7. ADAPTAÇÃO PARA CELULARES DA EQUIPE
### 📂 Arquivo para abrir no VS Code: `src/components/modules/doadoras/DoadorasTable.tsx`
* **Onde apontar com o mouse:** O trecho que tem `block md:hidden` (os cards de celular) e `hidden md:block` (a tabela de desktop).

### 🗣️ O QUE LER NA HORA:
> *"Por fim, pensamos muito na experiência de quem está na rua: o motorista e a enfermeira.*
> 
> *Como podemos ver aqui no `DoadorasTable.tsx`, nós implementamos uma interface responsiva inteligente: no computador da central, o sistema renderiza uma tabela clínica detalhada; mas se for aberto no celular, ele converte automaticamente para cartões verticais ergonômicos, fáceis de tocar com o polegar.*
> 
> *O mesmo foi feito no seletor de dias da semana, que vira um carrossel horizontal deslizável."*

---

## 🏆 8. ENCERRAMENTO (15 segundos)

### 🗣️ O QUE LER NA HORA:
> *"Para concluir: cada linha de código foi pensada para ser limpa, rápida, sem custos desnecessários com licenças e, acima de tudo, para garantir que o leite materno chegue com segurança e qualidade máxima aos bebês internados no Hospital Materno Infantil.*
> 
> *Obrigado e estou à disposição para dúvidas!"*
