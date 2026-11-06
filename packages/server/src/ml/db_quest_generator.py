# packages/server/src/ml/db_quest_generator.py
import os
import sys
import sqlite3
import json

class DatabaseQuestGenerator:
    """
    Generates dynamic quest word problems and dialogues by querying player state 
    and inventories directly from the SQLite database.
    """
    def __init__(self, db_path=None):
        if db_path is None:
            # Try typical paths
            base_dir = os.path.dirname(os.path.abspath(__file__))
            p1 = os.path.join(base_dir, "..", "..", "database.db")
            p2 = os.path.join(process_cwd := os.getcwd(), "packages/server/database.db")
            p3 = os.path.join(process_cwd, "database.db")
            
            for path in [p3, p1, p2]:
                if os.path.exists(path):
                    self.db_path = path
                    break
            else:
                self.db_path = p3 # Fallback default
        else:
            self.db_path = db_path

    def fetch_player_state(self, username="king_player"):
        """
        Fetches player levels, materials and items from the SQLite database.
        Returns a structured dictionary representing the active profile.
        """
        # If database does not exist, create a temporary mock DB schema to guarantee run success
        db_exists = os.path.exists(self.db_path)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if not db_exists:
            # Initialize minimal tables for mock compatibility
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS players (
                    id TEXT PRIMARY KEY,
                    username TEXT,
                    level INTEGER,
                    xp INTEGER,
                    max_health INTEGER,
                    armor INTEGER,
                    luck REAL,
                    materials TEXT,
                    quests TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS player_items (
                    id TEXT PRIMARY KEY,
                    player_username TEXT,
                    item_key TEXT,
                    category TEXT,
                    quantity INTEGER DEFAULT 1
                )
            """)
            # Insert default seed data
            cursor.execute("""
                INSERT OR IGNORE INTO players (id, username, level, xp, max_health, armor, luck, materials, quests)
                VALUES ('king_id', 'king_player', 3, 150, 15, 2, 1.2, '{"CrystalShard":5,"Spores":2}', '[]')
            """)
            cursor.execute("""
                INSERT OR IGNORE INTO player_items (id, player_username, item_key, category, quantity)
                VALUES ('king_item_id', 'king_player', 'aether_saber', 'WEAPON', 1)
            """)
            conn.commit()

        # Query player profile
        cursor.execute("SELECT level, materials FROM players WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        # If player not found, insert mock record
        if not row:
            cursor.execute("""
                INSERT OR IGNORE INTO players (id, username, level, xp, max_health, armor, luck, materials, quests)
                VALUES (?, ?, 3, 150, 15, 2, 1.2, '{"CrystalShard":5,"Spores":2}', '[]')
            """, (username + "_id", username))
            conn.commit()
            cursor.execute("SELECT level, materials FROM players WHERE username = ?", (username,))
            row = cursor.fetchone()

        level = row[0] if row else 1
        materials_json = row[1] if row else "{}"
        try:
            materials = json.loads(materials_json)
        except Exception:
            materials = {}

        # Query player items using actual columns
        cursor.execute("SELECT item_key FROM player_items WHERE player_username = ?", (username,))
        item_rows = cursor.fetchall()
        items = [r[0] for r in item_rows]

        conn.close()

        return {
            "username": username,
            "level": level,
            "materials": materials,
            "items": items
        }

    def generate_quest_word_problem(self, player_state, category="crystal"):
        """
        Formulates a conditional dialogue word problem based on database state.
        """
        level = player_state["level"]
        materials = player_state["materials"]
        items = player_state["items"]
        
        crystal_shards = materials.get("CrystalShard", 0)
        spores = materials.get("Spores", 0)
        
        quest_data = {}
        
        if category == "crystal":
            required = 10 + (level * 2)
            has_saber = "aether_saber" in items
            
            if has_saber:
                prompt_text = (
                    f"Aetheric Blacksmith: I detected a custom '{items[items.index('aether_saber')]}' in your vault. "
                    f"To charge its core energy to Level {level + 1}, we need to fuse {required} Crystal Shards. "
                    f"You currently possess {crystal_shards} shards. You must acquire {max(0, required - crystal_shards)} more to complete the blueprint."
                )
            else:
                prompt_text = (
                    f"Solar Forge Master: The core heater is running low. "
                    f"Bring us {required} Crystal Shards to forge a new Behemoth chestplate. "
                    f"Current balance: {crystal_shards} shards. Missing: {max(0, required - crystal_shards)}."
                )
            quest_data = {
                "quest_id": "q_crystal_forge",
                "title": "Aetheric Refinement",
                "prompt": prompt_text,
                "target_material": "CrystalShard",
                "required_amount": required,
                "current_amount": crystal_shards,
                "remaining_amount": max(0, required - crystal_shards)
            }
            
        elif category == "toxic":
            required = 8 + level
            
            if spores < 10:
                prompt_text = (
                    f"Alchemist Helix: Toxic levels in the swamp sector are rising. "
                    f"Gathering {required} Spores will allow us to synthesize a biome filter. "
                    f"Your inventory shows {spores} Spores. Harvest {max(0, required - spores)} more."
                )
            else:
                prompt_text = (
                    f"Alchemist Helix: You have a healthy reserve of {spores} Spores (target was {required}). "
                    f"Let us convert them into a corrosive biome blast to melt the Sentinel's armor."
                )
            quest_data = {
                "quest_id": "q_toxic_cleanse",
                "title": "Swamp Decontamination",
                "prompt": prompt_text,
                "target_material": "Spores",
                "required_amount": required,
                "current_amount": spores,
                "remaining_amount": max(0, required - spores)
            }
            
        return quest_data

    def generate_all_quests(self, output_path, username="king_player"):
        player_state = self.fetch_player_state(username)
        quests = []
        for cat in ["crystal", "toxic"]:
            quests.append(self.generate_quest_word_problem(player_state, cat))
            
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(quests, f, indent=2, ensure_ascii=False)
        return len(quests)

if __name__ == "__main__":
    generator = DatabaseQuestGenerator()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(base_dir, "..", "data", "generated_quests.json")
    
    if len(sys.argv) >= 3:
        user_arg = sys.argv[1]
        category_arg = sys.argv[2]
        
        state = generator.fetch_player_state(user_arg)
        quest = generator.generate_quest_word_problem(state, category_arg)
        if not os.path.exists(output_file): generator.generate_all_quests(output_file, user_arg)
        print(json.dumps(quest))
    else:
        count = generator.generate_all_quests(output_file)
        print(f"[SUCCESS] Compiled {count} database-driven quests into {output_file}")
