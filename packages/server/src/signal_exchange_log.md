# 🛰️ Log: Výmena Signálov a Správ v Systéme

Vygenerované dňa: 7/5/2026, 10:07:49 AM
Tento súbor ukazuje, ako si jednotlivé operácie a moduly vymieňajú informácie asynchrónne aj synchrónne bez priamej väzby.

## 1. Priebeh Správ v Mediátore

| Čas (relatívne) | Odosielateľ | Udalosť | Detail prenosu |
|:---|:---|:---|:---|
| `+0ms` | **SYSTEM** | `RegisterModule` | Modul [PHYSICS_RESOLVER] bol zaregistrovaný do výmennej siete. |
| `+0ms` | **SYSTEM** | `RegisterModule` | Modul [COMBAT_ENGINE] bol zaregistrovaný do výmennej siete. |
| `+0ms` | **COMBAT_ENGINE** | `RequestReceived` | Spracováva sa dopyt typu [RESOLVE_ATTACK]. |
| `+0ms` | **PHYSICS_RESOLVER** | `RequestReceived` | Spracováva sa dopyt typu [GET_BIOME_FRICTION]. |
| `+0ms` | **PUBLISHER** | `PublishEvent` | Publikovaná udalosť [ATTACK_COMPLETED]. |

## 2. Zachytené Systémové Telemetrické Udalosti (Pub-Sub)

*   `[SYSTEM LOG] Hráč player_alpha úspešne zaútočil na void_stalker_npc. Finálne poškodenie: 6 HP (Trenie biómu: 90%).`
