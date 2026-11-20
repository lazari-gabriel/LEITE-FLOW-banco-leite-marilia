# Design System Master File — LEITE FLOW (BLH Marília)

> Fonte única da verdade visual, alinhada 100% ao `tailwind.config.js` e à identidade hospitalar do Banco de Leite Humano do Hospital Materno Infantil de Marília – SP.

---

## 1. Paleta de Cores Clínica (`tailwind.config.js`)

| Role | Token Tailwind | Hex | Uso |
|---|---|---|---|
| Primary (Institucional) | `blh-primary` | `#235347` | Botões primários, abas ativas, links, marca |
| Primary Dark | `blh-primary-dark` | `#16362e` | Hover primário, pin sede BLH |
| Primary Soft | `blh-primary-soft` | `#eaf3f0` | Badges de zona, superfícies ativas |
| Accent (Coral Clínico) | `blh-accent` | `#cf6656` | Destaque de volumetria / indicadores secundários |
| Warning / Cold Alert | `blh-amber` | `#b87d28` | Pendências sorológicas, alertas de validade |
| Success | `blh-success` | `#15803d` | Apta (GO), temperatura conforme, pasteurizado |
| Danger | `blh-danger` | `#b91c1c` | Inapta (NO-GO), acidez > 8°D, descarte |
| Background | `blh-bg` | `#f4f7f6` | Fundo geral clínico suave |
| Surface | `blh-surface` | `#ffffff` | Cards, tabelas, modais |
| Text Primary | `blh-slate-900` | `#0f1c24` | Títulos, dados principais e sidebar desktop |
| Border | `blh-line` | `#dbe5e1` | Divisores, contornos de cards e inputs |

---

## 2. Tipografia

- **Títulos e Documentos:** `Fraunces` (`font-serif`)
- **Interface e Formulários:** `Plus Jakarta Sans` (`font-sans`)
- **Códigos de Frasco, Temperaturas, Placas, CPF/CNS:** `JetBrains Mono` (`font-mono tabular-nums`)

---

## 3. Padrões Obrigatórios (Tailwind v3.4 + WCAG 2.1 AA)

- Usar **exclusivamente classes válidas do Tailwind v3** (`shadow-sm`, `py-0.5`, `focus:outline-none focus:ring-2`). Proibido `shadow-xs`, `py-0.2`, `outline-hidden`.
- Todos os modais devem reutilizar `src/components/ui/Modal.tsx` (com `Escape`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
- Proibido usar `window.alert()` ou `window.confirm()` nativos; usar validação inline, `Modal` ou `Toast`.
- Proibido usar emojis como ícones de interface; usar ícones SVG de `lucide-react`.
- Todos os elementos interativos devem ser acessíveis por teclado (`<button>` / `<a>`) com contraste mínimo `4.5:1` e respeito a `prefers-reduced-motion`.
