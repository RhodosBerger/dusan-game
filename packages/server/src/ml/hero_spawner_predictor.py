# packages/server/src/ml/hero_spawner_predictor.py
import json
import os
import sys
import pickle
import warnings
warnings.filterwarnings("ignore")

try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


class SpawnerDataProcessor:
    """
    Processes environmental topology metrics and character perk levels
    to prepare features for the spawner prediction model.
    """
    def __init__(self, output_path):
        self.output_path = output_path

    def generate_synthetic_training_data(self):
        if not HAS_SKLEARN:
            return []
        np.random.seed(42)
        records = []

        for _ in range(500):
            meta = np.random.randint(0, 9)
            hex_id = np.random.randint(0, 7)
            perk_level = np.random.randint(1, 6)
            faction = np.random.randint(0, 4)

            if faction == 0:  # Crystal (Behemoth) - hot, dry environments
                temp = np.random.uniform(30.0, 45.0)
                humidity = np.random.uniform(0.1, 0.3)
                hazard = np.random.uniform(0.1, 0.4)
                friction = np.random.uniform(0.6, 0.9)
                conductivity = np.random.uniform(0.1, 0.4)
            elif faction == 1:  # Toxic (Swamp) - wet, swampy environments
                temp = np.random.uniform(20.0, 30.0)
                humidity = np.random.uniform(0.7, 0.95)
                hazard = np.random.uniform(0.4, 0.8)
                friction = np.random.uniform(0.3, 0.6)
                conductivity = np.random.uniform(0.6, 0.9)
            elif faction == 2:  # Void (Void Sanctum) - extreme hazards, low friction
                temp = np.random.uniform(0.0, 15.0)
                humidity = np.random.uniform(0.1, 0.5)
                hazard = np.random.uniform(0.7, 1.0)
                friction = np.random.uniform(0.0, 0.3)
                conductivity = np.random.uniform(0.3, 0.7)
            else:  # Druid (Forest) - temperate, stable
                temp = np.random.uniform(15.0, 25.0)
                humidity = np.random.uniform(0.4, 0.7)
                hazard = np.random.uniform(0.0, 0.3)
                friction = np.random.uniform(0.5, 0.8)
                conductivity = np.random.uniform(0.2, 0.5)

            records.append({
                "meta": meta,
                "hex": hex_id,
                "perk_level": perk_level,
                "temperature": round(temp, 2),
                "humidity": round(humidity, 2),
                "hazardIndex": round(hazard, 2),
                "friction": round(friction, 2),
                "conductivity": round(conductivity, 2),
                "faction": faction
            })

        return pd.DataFrame(records)


class HeroSpawnerPredictor:
    """
    Classifier to predict which Hero Faction / Entity fits the environment topology.
    """
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42) if HAS_SKLEARN else None
        self.is_trained = False
        self.factions_map = {0: "crystal", 1: "toxic", 2: "void", 3: "druid"}

    def train(self, df):
        if not HAS_SKLEARN or self.model is None:
            return
        features = ["meta", "hex", "perk_level", "temperature", "humidity", "hazardIndex", "friction", "conductivity"]
        X = df[features]
        y = df["faction"]
        self.model.fit(X, y)
        self.is_trained = True

    def predict_faction(self, input_features):
        if not HAS_SKLEARN or not self.is_trained:
            row = input_features[0]
            temp, humidity, hazard, friction, conductivity = row[3], row[4], row[5], row[6], row[7]
            if humidity >= 0.65 and hazard >= 0.35:
                return "toxic", 0.92
            if hazard >= 0.7 and friction <= 0.35:
                return "void", 0.88
            if temp >= 28.0 and humidity <= 0.35:
                return "crystal", 0.90
            if humidity >= 0.55 and conductivity >= 0.55:
                return "toxic", 0.85
            return "crystal", 0.80

        pred_class = int(self.model.predict(input_features)[0])
        probs = self.model.predict_proba(input_features)[0]
        confidence = float(probs[pred_class])

        return self.factions_map.get(pred_class, "crystal"), round(confidence, 2)

    def save_model(self, file_path):
        if HAS_SKLEARN and self.is_trained:
            with open(file_path, 'wb') as f:
                pickle.dump((self.model, self.is_trained), f)

    def load_model(self, file_path):
        if HAS_SKLEARN and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            try:
                with open(file_path, 'rb') as f:
                    self.model, self.is_trained = pickle.load(f)
            except Exception:
                self.is_trained = False
        else:
            self.is_trained = False


class SpawnerInferenceService:
    @staticmethod
    def run():
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "hero_spawner_model.pkl")

        predictor = HeroSpawnerPredictor()

        if HAS_SKLEARN:
            if not os.path.exists(model_path):
                processor = SpawnerDataProcessor(model_path)
                df = processor.generate_synthetic_training_data()
                predictor.train(df)
                predictor.save_model(model_path)
            else:
                predictor.load_model(model_path)

        if len(sys.argv) < 2:
            raw_row = [2, 3, 3, 22.5, 0.85, 0.6, 0.45, 0.75]
        else:
            try:
                raw_str = sys.argv[1].strip("'")
                data = json.loads(raw_str)
                raw_row = [
                    int(data.get("meta", 0)),
                    int(data.get("hex", 0)),
                    int(data.get("perk_level", 1)),
                    float(data.get("temperature", 20.0)),
                    float(data.get("humidity", 0.5)),
                    float(data.get("hazardIndex", 0.1)),
                    float(data.get("friction", 0.6)),
                    float(data.get("conductivity", 0.3))
                ]
            except Exception as ex:
                print(json.dumps({"error": f"Invalid JSON inputs: {str(ex)}"}))
                sys.exit(1)

        test_input = np.array([raw_row]) if HAS_SKLEARN else [raw_row]
        faction, confidence = predictor.predict_faction(test_input)

        response = {
            "predicted_hero_faction": faction,
            "confidence": confidence,
            "status": "SUCCESS"
        }
        print(json.dumps(response))


if __name__ == "__main__":
    SpawnerInferenceService.run()
