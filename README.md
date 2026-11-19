[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01/)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/bangfadli121-arch/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/c/gta6-trophy-guide-01/)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/bangfadli121-arch/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/c/gta6-trophy-guide-01/)

# Leonida Trophy Guide — GTA VI Platinum Tracker

An offline web app that guides you to the Grand Theft Auto VI platinum on PlayStation 5: all **55 trophies** with their official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze — 28 hidden on PSN), each with a guide written in our own words that cites its sources.

## What it does

- **Tracker** — tick trophies off as you earn them; progress is saved in your browser (localStorage), and can be exported to a file and imported back.
- **Filters** — by category (story, missable, collectibles, activities, completion), by grade, and by free-text search.
- **Spoiler setting** — hides the names and descriptions of story trophies until you tick them earned.
- **Roadmap to the platinum** — about 200 hours, difficulty 4/10, no online trophies, no difficulty trophies, no mission-medal trophies; cheats disable trophies and saving; no mission replay and no New Game Plus, so save manually at the start of every chapter and before the final mission.
- **Missables** — only one trophy is missable: **Positive Mental Attitude** (the Lucia balcony meditation spot in Chapter 1 disappears when Chapter 1 ends).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The app is static files under `app/` and works with the network off. Trophy data lives in `app/data/trophies.json`.

## Kit check

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
