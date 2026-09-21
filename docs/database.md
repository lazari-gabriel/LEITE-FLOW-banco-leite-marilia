# Modelo de Dados & Banco de Dados — BLH Marília

O sistema possui como entidade nuclear o **Frasco de Leite Materno**, garantindo a rastreabilidade total desde a doadora e extração domiciliar até a pasteurização e dispensação na UTI Neonatal.

---

## 1. Diagrama Entidade-Relacionamento Conceitual

```
+----------------+          1:N          +------------------+
|     Donor      | --------------------> |    Collection    |
|  (Doadora)     |                       |    (Visita)      |
+----------------+                       +------------------+
        |                                         |
        | 1:N                                     | 1:1
        v                                         v
+----------------+                       +------------------+
|    Triagem     |                       |      Bottle      |
|  (Go / No-Go)  |                       |     (Frasco)     |
+----------------+                       +------------------+
                                                  |
                                                  | 1:N
                                                  v
                                         +------------------+
                                         |    CustodyLog    |
                                         | (Rastreio N1-N3) |
                                         +------------------+
```

---

## 2. Dicionário de Entidades

### `Donor` (Doadora)
- `id`: Inteiro sequencial único (Ex: `DOAD-001`).
- `nome`: Nome completo da mãe.
- `bebe`: Nome do recém-nascido.
- `sus`: Número do Cartão Nacional de Saúde (15 dígitos).
- `parto`: Data do parto (determina se a classificação é Colostro, Transição ou Maduro).
- `zona`: Região logística de Marília (`Norte`, `Sul`, `Oeste`, `Leste`, `Rural`).
- `lat`, `lng`: Coordenadas geográficas para roteirização.
- `status`: Situação após triagem sanitária (`Aprovada` ou `Reprovada`).

### `Bottle` (Frasco como Entidade Central)
- `id`: Identificador interno único.
- `codigo`: Código sequencial e hospitalar padronizado (Ex: `BLH-MAR-2026-0042`).
- `doadoraId`: Chave estrangeira referenciando `Donor`.
- `volume`: Volume coletado em mL (Ex: `210`).
- `temp`: Temperatura aferida na caixa térmica em °C (Ex: `-17.2`).
- `classe`: Classificação biológica (`C` = Colostro, `T` = Transição, `M` = Maduro).
- `validadeCru`: Data limite calculada estritamente para 15 dias a `< -10°C`.
- `statusPast`: Situação na cadeia de processamento (`Em Triagem`, `Em Análise`, `Em Quarentena`, `Pasteurizado`, `Dispensado`).
- `acidez`: Medição de acidez Dornic (limite aceitável `≤ 8°D`).
- `crematocrito`: Teor calórico em Kcal/L (Ex: `650 Kcal/L`).
- `destinoUTI`: Leito e prontuário do recém-nascido prematuro receptor.
