# 📋 Guia de Apresentação — O Que Cada Arquivo Importante Faz
### Sistema LEITE FLOW · Banco de Leite Humano de Marília (Hospital Materno Infantil)

> **Dica para sua apresentação:** Cada arquivo foi desenhado com uma responsabilidade única e clara. Use as **analogias simples** abaixo para explicar para avaliadores, professores ou equipe médica sem precisar falar termos técnicos difíceis.

---

## 🏛️ BLOCO 1: Estrutura & Ponto de Partida (A Moldura Visual)

### 1. `index.html` — A Fachada do Aplicativo
* **Analogia Simples:** A porta de entrada do hospital.
* **O que ele faz:** É a primeira página que o navegador lê. Carrega as fontes médicas legíveis (*Fraunces* e *Plus Jakarta Sans*), o ícone oficial da aba do navegador (*favicon*) e o mapa Leaflet.
* **O que falar na apresentação:** *"É a base HTML onde o aplicativo ganha vida com as fontes hospitalares e os logos oficiais do Leite Flow."*

### 2. `src/App.tsx` — O Maestro da Navegação
* **Analogia Simples:** O recepcionista que direciona para a sala certa.
* **O que ele faz:** Observa qual aba o usuário clicou (Rotas, Mapa, Doadoras, Etiquetas ou Painel Geral) e troca a tela instantaneamente na tela sem precisar recarregar o navegador.
* **O que falar na apresentação:** *"Controla a navegação instantânea em tela única (SPA), garantindo que a equipe mude de tela em milissegundos sem travar."*

### 3. `src/components/layout/AppShell.tsx` — A Moldura do Sistema
* **Analogia Simples:** O esqueleto do prédio.
* **O que ele faz:** Monta o layout geral: segura o Cabeçalho no topo, a Barra Lateral no computador e a Barra Inferior móvel no celular.
* **O que falar na apresentação:** *"Garante que o sistema funcione com a mesma elegância num monitor da central ou no smartphone do motorista na van."*

### 4. `src/components/layout/Header.tsx` — O Painel de Telemetria Superior
* **Analogia Simples:** O velocímetro e termômetro do painel da van.
* **O que ele faz:** Mostra o logo oficial, o relógio em tempo real do turno e o sensor crítico de temperatura (-17.2°C) com selo de conformidade da ANVISA.
* **O que falar na apresentação:** *"Mantém visível a todo momento a segurança da cadeia de frio exigida pela ANVISA RDC 171/2006."*

---

## 🧠 BLOCO 2: O Cérebro do Sistema (Memória Central)

### 5. `src/context/AppContext.tsx` — A Memória Central (State Global)
* **Analogia Simples:** O prontuário único e compartilhado da equipe.
* **O que ele faz:** **É o arquivo mais importante do sistema.** Guarda tudo o que acontece na operação: lista de doadoras, rotas criadas, status de cada parada (pendente, coletada, pulada) e frascos recolhidos.
* **O que falar na apresentação:** *"Se o motorista marca uma coleta como feita no mapa, o AppContext avisa no mesmo milissegundo a lista de rotas e o painel de estatísticas, sem risco de dados desencontrados."*

### 6. `src/hooks/useApp.ts` — O Conector Direto
* **Analogia Simples:** O rádio comunicador da equipe.
* **O que ele faz:** Uma linha direta que permite que qualquer botão ou componente da tela converse com o `AppContext` para ler dados ou disparar ações.

---

## 🚐 BLOCO 3: Telas de Operação (O Dia a Dia na Van)

### 7. `src/components/modules/roteirizacao/RoteirizacaoView.tsx` — A Central de Rotas
* **Analogia Simples:** A prancheta digital da coordenadora de enfermagem.
* **O que ele faz:** Divide a operação em 3 momentos claros: **Gestão da Frota** (veículos e tripulação), **Montar Paradas** (quais casas visitar) e **Executar Coletas** (checklist na porta da casa da mãe).
* **O que falar na apresentação:** *"Permite organizar a rotina diária da van separada pelas zonas geográficas de Marília de segunda a sexta-feira."*

### 8. `src/components/modules/roteirizacao/RouteDispatcher.tsx` — O Despachador de Paradas
* **Analogia Simples:** A montagem da fila de visitas.
* **O que ele faz:** Permite adicionar, remover e reordenar mães na rota do dia, calculando na hora a quilometragem total e a meta de volume de leite em mL.
* **O que falar na apresentação:** *"A coordenadora pode alternar entre múltiplas rotas (ex: Van 01, Fiorino 02) e ver em grade 2x2 no celular a distância e tempo estimados."*

### 9. `src/components/modules/mapa/InteractiveMapView.tsx` — O GPS Inteligente por Ruas
* **Analogia Simples:** O Waze/Google Maps exclusivo do Banco de Leite.
* **O que ele faz:** Exibe o mapa de Marília com os pins numerados das doadoras e traça o **caminho real pelas ruas e esquinas** (motor OSRM), sem cobrar chaves de API nem usar linhas retas irreais.
* **Recursos extras:** Permite alternar entre mapa de ruas, satélite de alta definição e mapa claro, além de ter botão direto para abrir no Google Maps do celular do motorista.
* **O que falar na apresentação:** *"Resolveu o problema de mapas bloqueados e mostra o caminho viário curva a curva saindo do Hospital Materno Infantil até cada residência."*

---

## 👩‍🍼 BLOCO 4: Cadastro, Triagem e Rastreabilidade

### 10. `src/components/modules/doadoras/DoadorasTable.tsx` — O Censo de Mães Doadoras
* **Analogia Simples:** O arquivo de fichas médicas ativas.
* **O que ele faz:** Lista todas as doadoras de Marília com filtros por bairro/zona, pesquisa rápida por nome/SUS e status de aptidão. No computador é uma tabela completa; no celular vira cartões verticais com botões ergonômicos para o polegar.
* **O que falar na apresentação:** *"Permite à enfermagem consultar o histórico da mãe, ver quantos dias de vida o bebê tem e abrir direto a rota daquela mãe."*

### 11. `src/components/modules/doadoras/CadastroWizard.tsx` — A Triagem Médica Automatizada
* **Analogia Simples:** O protocolo de triagem clínica do Ministério da Saúde.
* **O que ele faz:** Formulário em 5 etapas rápidas que checa vacinas (Febre Amarela, dTpa), sorologia de exames de sangue, hábitos e condições de higiene.
* **O que falar na apresentação:** *"Aplica automaticamente o veredito 'Apta' ou 'Inapta' conforme as normas sanitárias, protegendo os prematuros da UTI Neonatal."*

### 12. `src/components/modules/etiquetas/ThermalLabelPreview.tsx` — A Carteira de Identidade do Frasco
* **Analogia Simples:** A certidão de nascimento de cada gota de leite.
* **O que ele faz:** Desenha a etiqueta hospitalar térmica padrão (60x40mm) com Código de Barras Code 128 e QR Code gerados em formato vetorial SVG puro.
* **O que falar na apresentação:** *"Funciona 100% offline, sem depender de internet para gerar o código de barras, pronta para impressoras térmicas hospitalares (Zebra/Argox)."*

### 13. `src/components/modules/dashboard/DashboardView.tsx` — O Painel Executivo
* **Analogia Simples:** A tela da diretoria do hospital.
* **O que ele faz:** Apresenta indicadores de impacto social: doadoras ativas, frascos em estoque, litros previstos e a matriz semanal de distribuição das coletas em Marília.

---

## ⚙️ BLOCO 5: Inteligência Logística & Médica (Services)

### 14. `src/services/routeService.ts` — Os Algoritmos da Rota
* **O que ele faz:**
  1. **Fórmula de Haversine:** Calcula a distância em km pela curvatura da Terra a partir do Hospital Materno Infantil.
  2. **Nearest Neighbor (Vizinho Mais Próximo):** Reordena as casas da mais perto para a mais longe, economizando combustível e tempo.
  3. **Traçado Viário OSRM:** Busca o desenho exato das curvas das ruas na malha viária de Marília.
* **O que falar na apresentação:** *"A van não roda à toa: o algoritmo calcula a ordem mais eficiente para recolher o leite no menor tempo possível."*

### 15. `src/services/donorService.ts` — O Algoritmo Clínico (Go / No-Go)
* **O que ele faz:**
  - Classifica biologicamente o leite com base na data do parto: **Colostro** (1 a 7 dias), **Transição** (8 a 15 dias) ou **Maduro** (+16 dias).
  - Bloqueia coletas se houver sorologia positiva (HIV, Hepatite, Sífilis) ou contraindicação médica.

### 16. `src/services/labelService.ts` — O Motor Gráfico Offline
* **O que ele faz:** Gera os traços das barras pretas e o quadriculado do QR Code diretamente em código matemático SVG, sem enviar nenhum dado para fora do computador.

---

## 🎨 BLOCO 6: Identidade Visual Oficial

### 17. `src/components/ui/Logo.tsx` e pasta `public/`
* **O que ele faz:** Contém as duas variações da marca oficial:
  - **Emblema Circular:** Usado na lateral (Sidebar) reforçando a instituição.
  - **Lockup Horizontal:** Usado no topo (Header) com boa legibilidade em qualquer dispositivo.
  - **Ícone Gota de Leite:** Usado no favicon da aba e dentro das etiquetas térmicas dos frascos.

---

## 💡 Roteiro Rápido de 2 Minutos para a sua Apresentação

> *"O **LEITE FLOW** é uma solução completa de engenharia de software e saúde pública desenvolvida para o Banco de Leite Humano do Hospital Materno Infantil de Marília.*
>
> *Nossa arquitetura foi organizada em 3 pilares fundamentais:*
> 1. * **Segurança Clínica:** O `donorService.ts` e o `CadastroWizard.tsx` garantem que apenas leite de mães aptas e com sorologia negativa seja recolhido, classificando o leite em Colostro, Transição e Maduro para atender a prescrição exata dos prematuros da UTI Neonatal.*
> 2. * **Eficiência Logística:** O `routeService.ts` e o `InteractiveMapView.tsx` usam algoritmos de roteirização geográfica para traçar a melhor rota curva a curva pelas ruas de Marília, economizando tempo e combustível.*
> 3. * **Rastreabilidade e Cadeia de Frio:** Monitoramos a temperatura do sensor térmico a -17°C no `Header.tsx` e emitimos etiquetas térmicas com QR Code e código de barras offline no `ThermalLabelPreview.tsx`.*
>
> *Tudo isso sincronizado em tempo real pelo `AppContext.tsx` e totalmente adaptado para telas de celular e tablets da equipe de campo."*
