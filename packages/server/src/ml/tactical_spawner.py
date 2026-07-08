# packages/server/src/ml/tactical_spawner.py
import sys
import json
import random

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "ERROR", "message": "Missing arguments"}))
        return

    try:
        payload = json.loads(sys.argv[1])
        tactic_prompt = payload.get("tactic_prompt", "stealth").lower()
        player_lvl = payload.get("player_level", 1)
        player_hp = payload.get("player_health", 15)
        biome = payload.get("biome", "LUSH_FOREST")
        inventory = payload.get("inventory", {})

        # Simple ML-like sample heuristic classifying the prompt, biome and level
        # to generate a custom tactical instance
        if "stealth" in tactic_prompt:
            action_type = "spawn_invisibility_shroud" if player_lvl >= 3 else "spawn_smoke_screen"
            description = f"Stealth tactic adapted for level {player_lvl} in {biome}. Deploying local refraction camouflage."
            target_meta = random.randint(0, 8)
            target_hex = random.randint(1, 6)
            power_rating = float(player_lvl * 1.5)
        elif "aggression" in tactic_prompt or "attack" in tactic_prompt:
            action_type = "spawn_voltage_trap" if "crystal" in biome.lower() else "spawn_toxic_mine"
            description = f"Aggressive layout generated. Placing tactical hazard based on biome {biome}."
            target_meta = random.randint(0, 8)
            target_hex = random.randint(1, 6)
            power_rating = float(player_lvl * 2.2)
        elif "defense" in tactic_prompt or "protect" in tactic_prompt:
            action_type = "spawn_kinetic_barrier" if player_hp < 7 else "spawn_refractor_shield"
            description = f"Defensive posture triggered at {player_hp} HP. Adapting protective shield emitter."
            target_meta = random.randint(0, 8)
            target_hex = random.randint(1, 6)
            power_rating = float(player_lvl * 1.8)
        else:
            action_type = "spawn_decoy"
            description = f"Default decoy deployed for prompt '{tactic_prompt}'."
            target_meta = random.randint(0, 8)
            target_hex = random.randint(1, 6)
            power_rating = 1.0

        output = {
            "status": "SUCCESS",
            "actionType": action_type,
            "coordinates": {
                "meta": target_meta,
                "hex": target_hex
            },
            "powerRating": power_rating,
            "description": description
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": str(e)}))

if __name__ == "__main__":
    main()
