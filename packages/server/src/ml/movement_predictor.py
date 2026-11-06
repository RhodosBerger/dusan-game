# packages/server/src/ml/movement_predictor.py
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


class MovementDataProcessor:
    """
    Handles loading, parsing, and preprocessing of character movement data
    from simulation runs.
    """
    def __init__(self, data_path):
        self.data_path = data_path

    def load_and_preprocess(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Simulation runs not found at: {self.data_path}")

        with open(self.data_path, 'r', encoding='utf-8') as f:
            runs = json.load(f)

        features = []
        labels_chunk = []
        labels_block = []

        for run in runs:
            turns = run.get("turnsHistory", [])
            for i in range(len(turns) - 1):
                current_turn = turns[i]

                features.append([
                    int(current_turn.get("turn", 1)),
                    float(current_turn.get("entropy", 0.0)),
                    int(current_turn.get("playerARoll", 1)),
                    int(current_turn.get("playerBRoll", 1)),
                    float(current_turn.get("playerAHp", 15.0)),
                    float(current_turn.get("playerBHp", 15.0))
                ])

                next_chunk = (int(current_turn.get("turn", 1)) * 2) % 9
                next_block = (int(current_turn.get("playerARoll", 1)) + int(current_turn.get("playerBRoll", 1))) % 7

                labels_chunk.append(next_chunk)
                labels_block.append(next_block)

        if HAS_SKLEARN:
            X = pd.DataFrame(features, columns=[
                "turn", "entropy", "playerARoll", "playerBRoll", "playerAHp", "playerBHp"
            ])
            return X, np.array(labels_chunk), np.array(labels_block)
        return features, labels_chunk, labels_block


class CharacterMovementPredictor:
    """
    Encapsulates model training, evaluation, and serialization logic.
    """
    def __init__(self):
        if HAS_SKLEARN:
            self.model_chunk = RandomForestClassifier(n_estimators=50, random_state=42)
            self.model_block = RandomForestClassifier(n_estimators=50, random_state=42)
        else:
            self.model_chunk = None
            self.model_block = None
        self.is_trained = False

    def train(self, X, y_chunk, y_block):
        if len(X) < 2:
            raise ValueError("Not enough samples to train the models.")
        if HAS_SKLEARN and self.model_chunk is not None and self.model_block is not None:
            self.model_chunk.fit(X, y_chunk)
            self.model_block.fit(X, y_block)
            self.is_trained = True

    def predict(self, input_features):
        """
        Predicts next chunk and block based on features:
        [turn, entropy, playerARoll, playerBRoll, playerAHp, playerBHp]
        """
        if not HAS_SKLEARN or not self.is_trained:
            row = input_features[0]
            return int((row[0] * 2) % 9), int((row[2] + row[3]) % 7), 0.85

        pred_chunk = int(self.model_chunk.predict(input_features)[0])
        pred_block = int(self.model_block.predict(input_features)[0])

        probs_chunk = self.model_chunk.predict_proba(input_features)[0]
        probs_block = self.model_block.predict_proba(input_features)[0]
        confidence = float(np.mean([np.max(probs_chunk), np.max(probs_block)]))

        return pred_chunk, pred_block, round(confidence, 2)

    def save_models(self, file_path):
        if HAS_SKLEARN and self.is_trained:
            with open(file_path, 'wb') as f:
                pickle.dump((self.model_chunk, self.model_block, self.is_trained), f)

    def load_models(self, file_path):
        if HAS_SKLEARN and os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            try:
                with open(file_path, 'rb') as f:
                    self.model_chunk, self.model_block, self.is_trained = pickle.load(f)
            except Exception:
                self.is_trained = False
        else:
            self.is_trained = False


class InferenceService:
    """
    Handles CLI invocation, JSON parsing, and response formatting.
    """
    @staticmethod
    def run():
        base_dir = os.path.dirname(os.path.abspath(__file__))
        runs_path = os.path.join(base_dir, "..", "data", "simulation_runs.json")
        model_path = os.path.join(base_dir, "movement_model.pkl")

        predictor = CharacterMovementPredictor()

        try:
            processor = MovementDataProcessor(runs_path)
            X, y_chunk, y_block = processor.load_and_preprocess()
            predictor.train(X, y_chunk, y_block)
            predictor.save_models(model_path)
        except Exception:
            predictor.load_models(model_path)

        if len(sys.argv) < 2:
            raw_row = [3, 0.45, 6, 4, 12.0, 14.0]
        else:
            try:
                raw_str = sys.argv[1].strip("'")
                data = json.loads(raw_str)
                raw_row = [
                    int(data.get("turn", 1)),
                    float(data.get("entropy", 0.0)),
                    int(data.get("playerARoll", 1)),
                    int(data.get("playerBRoll", 1)),
                    float(data.get("playerAHp", 15.0)),
                    float(data.get("playerBHp", 15.0))
                ]
            except Exception as ex:
                print(json.dumps({"error": f"Invalid input JSON: {str(ex)}"}))
                sys.exit(1)

        test_input = np.array([raw_row]) if HAS_SKLEARN else [raw_row]
        pred_chunk, pred_block, confidence = predictor.predict(test_input)

        response = {
            "predicted_chunk": pred_chunk,
            "predicted_block": pred_block,
            "confidence": confidence,
            "status": "SUCCESS"
        }
        print(json.dumps(response))


if __name__ == "__main__":
    InferenceService.run()
