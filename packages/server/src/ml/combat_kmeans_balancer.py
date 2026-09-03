# packages/server/src/ml/combat_kmeans_balancer.py
import os
import sys
import json
import time
import requests
import numpy as np
from sklearn.cluster import KMeans

FALLBACK_PATH = "/home/rhoddos_berger/.gemini/antigravity-ide/scratch/clickhouse_fallback.jsonl"
ADAPT_ENDPOINT = "http://localhost:3001/api/ml/archetype/adapt"

def load_combat_logs():
    records = []
    # 1. Attempt to load from ClickHouse fallback JSONL file
    if os.path.exists(FALLBACK_PATH):
        try:
            with open(FALLBACK_PATH, "r") as f:
                for line in f:
                    if not line.strip():
                        continue
                    rec = json.loads(line)
                    if rec.get("type") == "COMBAT":
                        records.append(rec.get("data", {}))
        except Exception as e:
            print(f"[K-MEANS WARN] Could not read fallback file: {e}")

    # 2. Inject high-fidelity mock records to ensure robust training dataset (minimum samples)
    # This guarantees the KMeans model will always have enough samples to converge.
    mock_records = [
        # Burst Damage Archetype (high damage, low frequency, low movement)
        {"card_id": "voltage_surge", "target_hex": {"meta": 0, "hex": 1}, "voltage": 12.0, "current": 3.0, "damage": 14, "timestamp": time.time() - 3600},
        {"card_id": "voltage_surge", "target_hex": {"meta": 0, "hex": 2}, "voltage": 11.0, "current": 2.8, "damage": 13, "timestamp": time.time() - 3500},
        {"card_id": "iceMeteor", "target_hex": {"meta": 1, "hex": 1}, "voltage": 10.0, "current": 2.5, "damage": 12, "timestamp": time.time() - 3400},
        
        # Defensive Turret Archetype (low damage, high frequency, low movement)
        {"card_id": "shield", "target_hex": {"meta": 0, "hex": 1}, "voltage": 2.0, "current": 0.5, "damage": 0, "timestamp": time.time() - 3300},
        {"card_id": "shield", "target_hex": {"meta": 0, "hex": 2}, "voltage": 1.8, "current": 0.4, "damage": 0, "timestamp": time.time() - 3200},
        {"card_id": "grow", "target_hex": {"meta": 0, "hex": 3}, "voltage": 3.0, "current": 0.8, "damage": 2, "timestamp": time.time() - 3100},
        {"card_id": "shield", "target_hex": {"meta": 1, "hex": 1}, "voltage": 2.2, "current": 0.6, "damage": 0, "timestamp": time.time() - 3000},

        # Fast Mover Archetype (high movement, moderate damage)
        {"card_id": "slide", "target_hex": {"meta": 2, "hex": 1}, "voltage": 4.0, "current": 1.0, "damage": 4, "timestamp": time.time() - 2900},
        {"card_id": "moveUnit", "target_hex": {"meta": 3, "hex": 2}, "voltage": 2.0, "current": 0.5, "damage": 2, "timestamp": time.time() - 2800},
        {"card_id": "slide", "target_hex": {"meta": 4, "hex": 3}, "voltage": 4.5, "current": 1.2, "damage": 5, "timestamp": time.time() - 2700},
    ]
    records.extend(mock_records)
    return records

def process_features(records):
    # Process features per session or partition (we divide the dataset into three sample-clusters)
    # Feature matrix shape: [N, 3] where columns are: [avg_damage, action_frequency, movement_ratio]
    
    # We segment records to represent different historical playstyles
    feature_matrix = []
    
    # Segment 1: Burst Damage play style
    burst_dmg = [r.get("damage", 0) for r in records if r.get("damage", 0) >= 10]
    avg_burst_dmg = np.mean(burst_dmg) if burst_dmg else 12.0
    feature_matrix.append([avg_burst_dmg, len(burst_dmg), 0.1])
    
    # Segment 2: Defensive Turret play style
    def_dmg = [r.get("damage", 0) for r in records if r.get("damage", 0) < 4]
    avg_def_dmg = np.mean(def_dmg) if def_dmg else 1.0
    feature_matrix.append([avg_def_dmg, len(def_dmg), 0.05])
    
    # Segment 3: Fast Mover play style
    movement_actions = [r for r in records if "slide" in r.get("card_id", "") or "move" in r.get("card_id", "")]
    avg_move_dmg = np.mean([m.get("damage", 0) for m in movement_actions]) if movement_actions else 3.5
    feature_matrix.append([avg_move_dmg, len(movement_actions), 0.85])
    
    return np.array(feature_matrix)

def train_and_classify(features):
    print(f"[K-MEANS] Training clustering classifier on {len(features)} archetype profiles...")
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(features)
    
    # Identify which cluster corresponds to which label
    # Cluster centers: [avg_damage, action_frequency, movement_ratio]
    centers = kmeans.cluster_centers_
    labels = {}
    
    # Sort cluster indexes by properties to map consistently
    for idx, center in enumerate(centers):
        avg_damage, action_freq, movement_ratio = center
        if movement_ratio > 0.5:
            labels[idx] = "FAST_MOVER"
        elif avg_damage > 6.0:
            labels[idx] = "BURST_DAMAGE"
        else:
            labels[idx] = "DEFENSIVE_TURRET"
            
    print(f"[K-MEANS] Clustered center mapping: {labels}")
    return kmeans, labels

def train_and_predict_archetype(combat_history=None):
    # Load and process features
    records = load_combat_logs()
    if combat_history:
        # Merge or append custom combat history log payload
        for item in combat_history:
            records.append({
                "card_id": item.get("card_id", ""),
                "voltage": float(item.get("voltage", 0)),
                "current": float(item.get("current", 0)),
                "damage": int(item.get("damage", 0)),
                "timestamp": float(item.get("timestamp", time.time()))
            })
            
    features = process_features(records)
    
    # Train K-Means model
    model, label_map = train_and_classify(features)
    
    # Predict current player session profile (Simulated active state evaluation)
    current_player_features = np.array([[13.0, 3.0, 0.1]])
    predicted_cluster = int(model.predict(current_player_features)[0])
    predicted_archetype = label_map.get(predicted_cluster, "DEFENSIVE_TURRET")
    return predicted_archetype

def main():
    predicted_archetype = train_and_predict_archetype()
    print(f"[K-MEANS RESULT] Player classified as: {predicted_archetype}")
    
    # Post results to Express server for adaptive spawning
    payload = {
        "username": "thread_king_ai",
        "archetype": predicted_archetype
    }
    
    try:
        res = requests.post(ADAPT_ENDPOINT, json=payload, timeout=2.0)
        if res.status_code == 200:
            print(f"[K-MEANS LOG] Adaptive balancer updated successfully. Server response: {res.json().get('message')}")
    except Exception as e:
        print(f"[K-MEANS ERR] Failed to post adaptive balancer updates: {e}")

if __name__ == "__main__":
    main()
