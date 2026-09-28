# Decotrap – nieuwe homepagina (prototype)

Statisch prototype van de nieuwe homepagina van Decotrap, richting "A · Geist".
Eén stijlgids met twee kleurversies:

- **Lime**: linnen, diep groen en logogroen (`#C4C800`) als accent.
- **Zwart-wit**: neutraal gebroken wit en bijna-zwart, met logogroen enkel als klein accent.

De schakelaar onderaan de pagina wisselt tussen beide (enkel voor de preview).

## Bekijken

Open `index.html` via een lokale server, bijvoorbeeld:

```bash
python3 -m http.server 8000
```

en ga naar http://localhost:8000.

## Structuur

- `styles.css`: tokens per thema (`[data-theme="lime"]`, `[data-theme="zw"]`) en alle componenten.
- `main.js`: themaschakelaar, mobiel menu, video-dialoog, reveal- en treden-animatie.
- `img/`: foto's (Studiovision) en logo.
- `video/`: promofilm van de Trap-o-theek.
