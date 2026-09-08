# Dungeon Reset — credits and asset provenance

Created and owned by Ernest Turner. Game concept and creative direction: Ernest Turner. Design, programming, art direction, synthesized audio, and testing: Codex in collaboration with Ernest.

## Original artwork

Both production images were created specifically for Dungeon Reset with the built-in OpenAI ImageGen tool on 2026-09-08. No third-party character designs, stock illustrations, or paid asset packs were used. Original PNGs are preserved in the project; Phaser uses custom atlas rectangles without destructive image edits.

| File | Dimensions | Use |
| --- | --- | --- |
| assets/dungeon.png | 1536 × 1024 RGB | Single-room illustrated background |
| assets/sprites.png | 1536 × 1024 RGBA | Twelve transparent character and fixture sprites |

Background generation prompt:

> Use case: stylized-concept. Asset type: production raster background for browser game Dungeon Reset. Create an original landscape 1536x1024 illustration of a single empty fantasy dungeon room, flat orthographic slightly top-down camera. Dark desaturated navy and teal blue stone tiled floor occupies about 80% of image as broad completely empty playable center. Chunky slate stone walls along the upper edge and thin side edges; just two small warm amber wall torches, tiny restrained skull and cobweb details only against edges. Charming storybook cartoon with bold deep navy outlines, softly painterly stone texture, humorous cozy-spooky atmosphere. Subtle floor tile patterns, very low center contrast, no strong perspective convergence or isometric diamond. Room entirely fills frame. No characters, creatures, traps, treasure chests, doors, furniture, interface, text, lettering, logos or watermark.

Sprite atlas generation prompt:

> Use case: stylized-concept. Asset type: original production game sprite atlas, 1536x1024 PNG with genuinely transparent alpha background. EXACTLY TWELVE isolated sprites laid out in an even regular grid FOUR columns by THREE rows of equal 384x341 cells. Each sprite centered within its own cell, 15% padding on all sides, no overlap with other cells. No drawn grid or cell borders. Cohesive charming humorous cozy-spooky storybook cartoon style, thick deep navy outlines, softly painterly texture, compact simple silhouettes readable at 80 pixels, orthographic slightly top-down / front-three-quarter view. Consistent light from upper left. Row 1 left to right: green goblin holding wooden club; ivory skeleton holding short spear; plump purple slime wearing tiny golden crown; brave human knight in steel armor with vivid blue cape. Row 2 left to right: square floor spike trap with silver spikes; compact wooden crossbow bolt turret on short stone pedestal; red glowing rune brazier fire trap; closed chunky wooden treasure chest with gold bands. Row 3 left to right: upright round-topped wooden dungeon door in narrow stone frame, front view; low puddle of spilled purple goo with tiny debris pieces; weary short hooded dungeon caretaker carrying a straw broom, face visible and tired; small pile of shiny golden coins. Every requested subject exactly once. No ground plane or background, no text or letters or symbols resembling labels, no watermark. Real transparent background, preserve alpha.

The atlas was visually inspected and alpha transparency verified. Its row extents are not mathematically uniform, so game.js contains explicit frame rectangles. All final asset paths above are local to the distributable; it makes no image service requests.

## Audio and typography

“After Hours in D Minor” is an original 32-step procedural melody with a quiet bass accompaniment. All music and work/impact/completion sounds are synthesized locally in Web Audio; no recordings or samples are included. Browser sound permission is unlocked only after player interaction. The interface uses system Georgia and Arial fonts, with no remote font requests.

## Engine and licenses

Phaser 3.90.0, copyright Phaser Studio Inc., is distributed under the MIT License. Its complete license is in vendor/PHASER-LICENSE.md. Official sources: https://phaser.io/download/release/v3.90.0 and https://phaser.io/download/license .

The browser release contains Phaser and original game files only. Node.js is an optional local HTTP host and is not bundled. The source project retains its Sites scaffold; React, Vite/vinext, and development/testing tools are not shipped in the static game archive. Their notices remain in their respective installed packages.

No telemetry, accounts, advertising, online services, or monetization.
