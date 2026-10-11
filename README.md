# Spicewood

A top-down autumn action-RPG for the browser (HTML5 Canvas, no dependencies, runs as a static page).
Vertical slice: hero select, the village of Hearthmoor, Ember Glade, the Hollow Oak dungeon and the boss Old Barkfather.

## Controls
- Move: WASD / arrow keys (touch: on-screen stick)
- Attack (3-hit combo): J
- Skills: K, L
- Roll: Space
- Interact: E / Enter
- Bag: I, Skills & talents: T, Potion: Q, Pause: P, Back: Backspace, Sound: M

## Base and crafting
Gather wood, ore, herbs, leather and shells in the wild (cut logs and ore veins, pick herbs, loot enemies). In Hearthmoor the Smithy forges, upgrades, reforges and salvages gear, the Alchemist brews potions and elixirs, the Tavern serves buffing meals and the Storehouse expands your bag. Upgrading buildings is tied to story progress.

## Embedding
Designed to run inside an iframe on Holiday Games. It posts `{type:'ready'}` on load and `{type:'score', value}` on level-up.

## Run locally
Open `index.html` in a browser (or serve the folder with any static server).
