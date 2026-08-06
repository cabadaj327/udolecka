# Plánování směn

Jednoduchá webová aplikace pro plánování směn malé firmy (10 zaměstnanců).

## Funkce

- Kalendář na měsíc dopředu (navigace mezi měsíci šipkami)
- Tři typy směn: **Ráno**, **Odpoledne**, **Celý den**
- Kliknutím na den se otevře okno, kde pro každého zaměstnance vybereš jeho směnu
- Správa zaměstnanců (přidání, přejmenování, odebrání) v levém panelu
- Přehled počtu odpracovaných směn za měsíc pro každého zaměstnance (pro spravedlivé rozvržení)
- Export rozpisu do CSV a tisk / export do PDF (přes tisk prohlížeče)
- Data se ukládají přímo v prohlížeči (localStorage) — není potřeba žádný server ani instalace

## Použití

Stačí otevřít soubor `index.html` v prohlížeči, nebo appku nahrát na statický hosting
(např. GitHub Pages) a sdílet odkaz s firmou.

> Pozor: data jsou uložená lokálně v prohlížeči daného zařízení. Pokud plánuje směny
> více lidí z různých počítačů, je potřeba rozpis po dokončení exportovat (CSV/tisk)
> a sdílet, nebo appku nasadit s reálným úložištěm/backendem.
