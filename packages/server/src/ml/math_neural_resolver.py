# packages/server/src/ml/math_neural_resolver.py
import numpy as np

class MathNeuralResolver:
    def __init__(self):
        # 6 inputs: voltage, current, resistance, entropy, player_health, npc_health
        # 3 outputs: contested_multiplier, predicted_current_overload, dopamine_reward_scale
        np.random.seed(42)
        self.W1 = np.random.randn(6, 8) * 0.1
        self.b1 = np.zeros((1, 8))
        self.W2 = np.random.randn(8, 6) * 0.1
        self.b2 = np.zeros((1, 6))
        self.W3 = np.random.randn(6, 3) * 0.1
        self.b3 = np.zeros((1, 3))

    def relu(self, x):
        return np.maximum(0, x)

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-np.clip(x, -50, 50)))

    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self.relu(self.z2)
        self.z3 = np.dot(self.a2, self.W3) + self.b3
        return self.sigmoid(self.z3)

    def resolve(self, voltage, current, resistance, entropy, player_health, npc_health):
        X = np.array([[voltage, current, resistance, entropy, player_health, npc_health]], dtype=np.float32)
        out = self.forward(X)[0]
        
        # Scale outputs to valid physical ranges
        contested_multiplier = float(out[0] * 2.0)
        predicted_current_overload = float(out[1] * 15.0)
        dopamine_reward_scale = float(out[2] * 2.0)

        # Apply Ohm's Law stress formula: expected current = voltage / resistance
        formula_current = float(voltage / max(0.1, resistance))

        return {
            "contested_multiplier": round(contested_multiplier, 3),
            "predicted_current_overload": round(predicted_current_overload, 3),
            "dopamine_reward_scale": round(dopamine_reward_scale, 3),
            "formula_current": round(formula_current, 3)
        }

# Global instance for thread-safe warm-inference
resolver_instance = MathNeuralResolver()
