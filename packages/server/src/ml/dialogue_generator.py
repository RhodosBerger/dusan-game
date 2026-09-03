# packages/server/src/ml/dialogue_generator.py
import json
import os
import sys
import random

# Predefined dictionary/vocabulary per character faction archetype
ARCHETYPE_LEXICON = {
    "AETHER_SPELLWEAVER": {
        "greeting": ["Greetings, fellow compiler.", "Aetheric frequencies aligned.", "Initiating spell socket handshake."],
        "action_verbs": ["compile", "re-synthesize", "channel", "decode", "override"],
        "nouns": ["aetheric grid", "buffer overflow", "mana thread", "source code", "voltage pool"],
        "adjectives": ["algorithmic", "magical", "encrypted", "unstable", "spectral"]
    },
    "GIGANTIC_BEHEMOTH": {
        "greeting": ["Halt! Heavy unit standing guard.", "My armor is absolute.", "State your core business."],
        "action_verbs": ["crush", "shred", "smash", "fortify", "demolish"],
        "nouns": ["heavy barrier", "kinetic shield", "titan hammer", "iron core", "fortress"],
        "adjectives": ["gigantic", "unyielding", "dense", "colossal", "brute"]
    },
    "SWIFT_HARBINGER": {
        "greeting": ["Quiet... shadows are listening.", "Need a fast bypass?", "Scanning latency sectors."],
        "action_verbs": ["sneak", "bypass", "slip", "recon", "overclock"],
        "nouns": ["latency loop", "hidden protocol", "scout probe", "stealth cloak", "shadow blade"],
        "adjectives": ["rapid", "covert", "stealthy", "low-latency", "swift"]
    },
    "VOID_WALKER": {
        "greeting": ["The void welcomes you.", "Entropy is rising.", "I speak for the zero state."],
        "action_verbs": ["collapse", "dissolve", "corrupt", "destabilize", "decay"],
        "nouns": ["void rift", "entropy pool", "decaying matrix", "vacuum", "zero point"],
        "adjectives": ["chaotic", "entropic", "void-touched", "unstable", "nullified"]
    }
}

# Quest-stage templates
STAGE_TEMPLATES = {
    "FetchQuest": {
        "INTRO": [
            "{greeting} I need you to {action_verb} a {adjective} {noun} from the sector. The {noun} is vital.",
            "Handshake request: Please {action_verb} {adjective} {noun} instances for calibration."
        ],
        "IN_PROGRESS": [
            "Still waiting for the {noun}. Ensure it is not {adjective}.",
            "Status check: Have you finished the search for the {adjective} {noun}?"
        ],
        "COMPLETED": [
            "Calibration successful. The {adjective} {noun} is integrated. Thank you.",
            "Transfer complete. {greeting} You have successfully processed the {noun}."
        ]
    },
    "CombatQuest": {
        "INTRO": [
            "{greeting} We must {action_verb} the glitched {adjective} monsters in this sector.",
            "Warning: {adjective} NPCs detected. {action_verb} them to prevent a {noun} collapse."
        ],
        "IN_PROGRESS": [
            "Threats still active. Continue to {action_verb} the targets.",
            "Combat status: Eliminate the remaining {adjective} entities."
        ],
        "COMPLETED": [
            "Area cleared. All glitched {noun} loops have been terminated.",
            "Security restored. The {adjective} threats are completely deleted."
        ]
    }
}

class RuleBasedDialogueGenerator:
    """
    Simulates a constrained LLM dialogue engine using structured lexical tokens 
    and state transitions.
    """
    def __init__(self, archetype, quest_type, stage):
        self.archetype = archetype if archetype in ARCHETYPE_LEXICON else "AETHER_SPELLWEAVER"
        self.quest_type = quest_type if quest_type in STAGE_TEMPLATES else "FetchQuest"
        self.stage = stage if stage in STAGE_TEMPLATES[self.quest_type] else "INTRO"
        self.lexicon = ARCHETYPE_LEXICON[self.archetype]
        self.templates = STAGE_TEMPLATES[self.quest_type][self.stage]

    def generate_dialogue(self, seed=None):
        if seed is not None:
            random.seed(seed)
            
        template = random.choice(self.templates)
        
        # Substitute placeholders with archetype-specific words
        greeting = random.choice(self.lexicon["greeting"])
        action_verb = random.choice(self.lexicon["action_verbs"])
        noun = random.choice(self.lexicon["nouns"])
        adjective = random.choice(self.lexicon["adjectives"])
        
        dialogue = template.format(
            greeting=greeting,
            action_verb=action_verb,
            noun=noun,
            adjective=adjective
        )
        return dialogue

class DialogueDatasetBuilder:
    """
    Generates and saves a dataset of dialogue interactions for offline verification.
    """
    @staticmethod
    def build_dataset(output_path):
        dataset = []
        # Generate permutations of all archetypes, quest types, and stages
        for arch in ARCHETYPE_LEXICON.keys():
            for q_type in STAGE_TEMPLATES.keys():
                for stage in STAGE_TEMPLATES[q_type].keys():
                    generator = RuleBasedDialogueGenerator(arch, q_type, stage)
                    # Generate 3 variations per combination
                    for variation in range(3):
                        text = generator.generate_dialogue(seed=variation + 42)
                        dataset.append({
                            "archetype": arch,
                            "quest_type": q_type,
                            "stage": stage,
                            "variation": variation,
                            "generated_text": text
                        })
                        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
            
        return len(dataset)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "..", "data", "dialogue_dataset.json")
    
    # Check if CLI arguments are provided for direct inference
    if len(sys.argv) >= 4:
        arch_arg = sys.argv[1]
        q_type_arg = sys.argv[2]
        stage_arg = sys.argv[3]
        
        generator = RuleBasedDialogueGenerator(arch_arg, q_type_arg, stage_arg)
        generated_text = generator.generate_dialogue()
        
        response = {
            "archetype": arch_arg,
            "quest_type": q_type_arg,
            "stage": stage_arg,
            "generated_dialogue": generated_text,
            "status": "SUCCESS"
        }
        print(json.dumps(response))
    else:
        # Generate full dataset
        count = DialogueDatasetBuilder.build_dataset(dataset_path)
        print(f"[SUCCESS] Generated {count} dialogue templates in {dataset_path}")
