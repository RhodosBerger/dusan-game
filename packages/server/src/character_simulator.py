import json
import random
import os

def roll_dice(sides):
    return random.randint(1, sides)

def generate_character_build(faction):
    # Determine dice type based on faction
    if faction == "crystal":
        dice_sides = 12
        archetype = "Behemoth / Spellweaver"
    elif faction == "toxic":
        dice_sides = 6
        archetype = "Swift Harbinger"
    elif faction == "void":
        dice_sides = 12
        archetype = "Void Walker"
    else:  # druid
        dice_sides = 10
        archetype = "Nature Keeper"
        
    level = random.randint(1, 5)
    max_hp = 15 + level * 2
    armor = random.randint(0, 3)
    luck = round(random.uniform(0.1, 0.8), 2)
    
    # Dynamic attributes influenced by imaginary dice rolls
    roll_val = roll_dice(dice_sides)
    base_dmg = round(roll_val * 1.5 + level, 1)
    
    return {
        "faction": faction,
        "archetype": archetype,
        "level": level,
        "maxHp": max_hp,
        "hp": max_hp,
        "armor": armor,
        "luck": luck,
        "diceType": f"D{dice_sides}",
        "baseDamage": base_dmg
    }

def simulate_match(level, player_a, player_b):
    turns = []
    current_turn = 1
    entropy = level["startingEntropy"]
    max_turns = level["maxTurns"]
    
    player_a_hp = player_a["maxHp"]
    player_b_hp = player_b["maxHp"]
    
    # Scenarios timeline trigger
    scenario_turn = random.randint(3, max_turns - 2)
    scenarios = ["BOSS_SPAWN", "ARENA_COLLAPSE", "SYSTEM_OVERLOAD", "HAZARD_ERUPTION"]
    triggered_scenario = random.choice(scenarios)
    
    while current_turn <= max_turns and player_a_hp > 0 and player_b_hp > 0:
        # Step 1: Roll dice for both players' actions this turn
        a_roll = roll_dice(int(player_a["diceType"][1:]))
        b_roll = roll_dice(int(player_b["diceType"][1:]))
        
        # Calculate voltage, current, and damage outcomes
        a_voltage = round(a_roll * 1.1 + player_a["luck"] * 2, 2)
        b_voltage = round(b_roll * 1.1 + player_b["luck"] * 2, 2)
        
        a_dmg = max(1, round(a_voltage - player_b["armor"], 1))
        b_dmg = max(1, round(b_voltage - player_a["armor"], 1))
        
        # Apply damage
        player_b_hp = round(max(0, player_b_hp - a_dmg), 1)
        player_a_hp = round(max(0, player_a_hp - b_dmg), 1)
        
        # Entropy ticks up slightly each turn
        entropy = round(min(1.0, entropy + 0.05), 2)
        
        turn_log = {
            "turn": current_turn,
            "playerARoll": a_roll,
            "playerAActionDmg": a_dmg,
            "playerBRoll": b_roll,
            "playerBActionDmg": b_dmg,
            "playerAHp": player_a_hp,
            "playerBHp": player_b_hp,
            "entropy": entropy,
            "event": None
        }
        
        # Trigger Scenario Outline
        if current_turn == scenario_turn:
            turn_log["event"] = triggered_scenario
            if triggered_scenario == "BOSS_SPAWN":
                # Boss deals extra damage to both players
                player_a_hp = round(max(0, player_a_hp - 3), 1)
                player_b_hp = round(max(0, player_b_hp - 3), 1)
            elif triggered_scenario == "ARENA_COLLAPSE":
                # Restricts movement, increases tension
                entropy = round(min(1.0, entropy + 0.2), 2)
            elif triggered_scenario == "SYSTEM_OVERLOAD":
                # Boosts damage
                player_a_hp = round(max(0, player_a_hp - 2), 1)
                player_b_hp = round(max(0, player_b_hp - 2), 1)
            elif triggered_scenario == "HAZARD_ERUPTION":
                # Direct hazard damage
                player_a_hp = round(max(0, player_a_hp - 4), 1)
                player_b_hp = round(max(0, player_b_hp - 4), 1)
                
            turn_log["playerAHp"] = player_a_hp
            turn_log["playerBHp"] = player_b_hp
            turn_log["entropy"] = entropy
            
        turns.append(turn_log)
        current_turn += 1
        
    winner = None
    if player_a_hp <= 0 and player_b_hp <= 0:
        winner = "DRAW"
    elif player_a_hp <= 0:
        winner = player_b["faction"]
    elif player_b_hp <= 0:
        winner = player_a["faction"]
    else:
        winner = player_a["faction"] if player_a_hp > player_b_hp else player_b["faction"]
        
    return {
        "levelId": level["id"],
        "levelName": level["name"],
        "difficulty": level["difficulty"],
        "triggeredScenario": triggered_scenario,
        "scenarioTurn": scenario_turn,
        "winner": winner,
        "finalEntropy": entropy,
        "totalTurns": current_turn - 1,
        "turnsHistory": turns
    }

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    levels_path = os.path.join(base_dir, "data", "levels.json")
    runs_path = os.path.join(base_dir, "data", "simulation_runs.json")
    
    if not os.path.exists(levels_path):
        print(f"[ERROR] levels.json not found at {levels_path}")
        return
        
    with open(levels_path, "r", encoding="utf-8") as f:
        levels = json.load(f)
        
    factions = ["crystal", "toxic", "void", "druid"]
    simulation_results = []
    
    # Run 10 simulated matches (2 for each level)
    for level in levels:
        for match_num in range(2):
            faction_a = random.choice(factions)
            faction_b = random.choice([f for f in factions if f != faction_a])
            
            player_a = generate_character_build(faction_a)
            player_b = generate_character_build(faction_b)
            
            result = simulate_match(level, player_a, player_b)
            result["playerABuild"] = player_a
            result["playerBBuild"] = player_b
            result["matchIndex"] = match_num + 1
            
            simulation_results.append(result)
            
    with open(runs_path, "w", encoding="utf-8") as f:
        json.dump(simulation_results, f, indent=2, ensure_ascii=False)
        
    print(f"[SIMULATOR SUCCESS] Successfully simulated {len(simulation_results)} matches on 5 levels.")
    print(f"Results written to: {runs_path}")

if __name__ == "__main__":
    main()
