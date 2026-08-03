# Contributing to Dušan Game Engine

Ďakujeme za záujem prispieť do nášho open-source projektu! Tento dokument vám pomôže začať.

## 📚 Obsah

- [Ako začať](#ako-začať)
- [Vývojové prostredie](#vývojové-prostredie)
- [Štruktúra kódu](#štruktúra-kódu)
- [Pull Request Proces](#pull-request-proces)
- [Štandardy kódu](#štandardy-kódu)
- [Komunita](#komunita)

---

## 🚀 Ako začať

### 1. Forknite repozitár
Kliknite na "Fork" v pravom hornom rohu GitHubu.

### 2. Naklonujte fork
```bash
git clone https://github.com/VAŠE_MENO/engine.git
cd engine
```

### 3. Nainštalujte dependencie
```bash
npm install
```

### 4. Spustite vývojový server
```bash
npm run dev
```

---

## 💻 Vývojové prostredie

### Požiadavky
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Odporúčané rozšírenia VS Code
- ESLint
- Prettier
- TypeScript Hero
- GitLens

---

## 📁 Štruktúra kódu

Projekt je organizovaný ako monorepo:

```
packages/          # Jadrové knižnice
apps/              # Aplikácie (klient, server, editor)
tools/             # CLI a dokumentácia
```

Každý balík má vlastný `package.json` a testy.

---

## 🔀 Pull Request Proces

### 1. Vytvorte branch
```bash
git checkout -b feature/nova-mechanika
```

### 2. Implementujte zmenu
- Pridajte testy pre nový kód
- Dodržujte štandardy kódu
- Aktualizujte dokumentáciu ak je potrebné

### 3. Commitujte
```bash
git add .
git commit -m "feat: pridaná nová mechanika generovania levelov"
```

**Formát commitov:**
- `feat:` - nová funkcionalita
- `fix:` - oprava chyby
- `docs:` - zmena dokumentácie
- `style:` - formátovanie kódu
- `refactor:` - refactoring bez zmeny funkcionality
- `test:` - pridanie testov
- `chore:` - údržba

### 4. Pushnite a vytvorte PR
```bash
git push origin feature/nova-mechanika
```

Na GitHub-e otvorte Pull Request do `main` branchu.

### 5. Code Review
- Minimálne 1 approve od maintainera je potrebný
- Odpovedzte na feedback včas
- Po schválení bude PR zlúčený

---

## 📝 Štandardy kódu

### TypeScript
- Používajte TypeScript pre všetok kód
- Definujte typy pre všetky funkcie a premenné
- Vyhnite sa `any` typu

### Formátovanie
- Používajte Prettier s predvoleným configom
- Dĺžka riadku: 100 znakov
- Single quotes pre stringy

### Testy
- Každá nová funkcionalita musí mať testy
- Cieľová coverage: 80%+
- Spustite testy pred odoslaním PR: `npm test`

### Dokumentácia
- Dokumentujte verejné API pomocou JSDoc
- Aktualizujte README.md ak pridávate nové balíky
- Pridajte príklady použitia

---

## 🤝 Komunita

### Kódex správania
Buďte rešpektujúci a inkluzívni. Diskriminácia a toxické správanie nebude tolerované.

### Kanály komunikácie
- **Discord:** [odkaz]
- **GitHub Discussions:** [odkaz]
- **Twitter:** [@dusan_game]

### Licencia
Príspevkom súhlasíte s licenciou MIT pre kód a CC-BY-SA 4.0 pre assety.

---

## ❓ Časté otázky

**Q: Môžem prispieť aj keď nie som skúsený vývojár?**  
A: Áno! Hľadáme príspevky všetkých úrovní. Začnite s označenými issue ako "good first issue".

**Q: Ako môžem navrhnúť novú funkcionalitu?**  
A: Otvorte GitHub Discussion alebo Issue s detailným popisom.

**Q: Budem uvedený ako autor?**  
A: Áno, všetci prispievatelia sú uvedení v CONTRIBUTORS.md a v git histórii.

---

Ďakujeme, že pomáhate budovať Dušan Game Engine! 🎮
