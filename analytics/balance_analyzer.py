import os
import json
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# Artifacts output directory for visualization
ARTIFACT_DIR = "/home/rhoddos_berger/.gemini/antigravity-ide/brain/6d7b80d4-47da-439a-99b2-bb6b38bf0acc"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# 1. Base card dataset seeded with current PhysicsActionDataset rules + simulated win rates
data = [
    {"id": "crystal_laser", "voltage": 4.5, "resistance": 1.5, "cost": 3, "win_rate": 52.4},
    {"id": "crystal_shield", "voltage": 0.5, "resistance": 4.0, "cost": 2, "win_rate": 49.1},
    {"id": "crystal_teleport", "voltage": 2.0, "resistance": 2.0, "cost": 2, "win_rate": 50.8},
    {"id": "crystal_pulse", "voltage": 3.0, "resistance": 1.0, "cost": 3, "win_rate": 51.5},
    {"id": "snake_venom", "voltage": 4.0, "resistance": 1.0, "cost": 2, "win_rate": 54.2},
    {"id": "acid_rain", "voltage": 5.0, "resistance": 2.0, "cost": 3, "win_rate": 53.0},
    {"id": "toxic_hook", "voltage": 3.0, "resistance": 1.5, "cost": 2, "win_rate": 51.2},
    {"id": "mud_slide", "voltage": 2.0, "resistance": 2.5, "cost": 2, "win_rate": 48.5},
    {"id": "bear_swipe", "voltage": 5.5, "resistance": 1.0, "cost": 3, "win_rate": 55.6},
    {"id": "forest_grow", "voltage": 1.5, "resistance": 3.5, "cost": 2, "win_rate": 49.3},
    {"id": "wind_gust", "voltage": 2.5, "resistance": 1.5, "cost": 2, "win_rate": 50.2},
    {"id": "nature_heal", "voltage": 1.0, "resistance": 3.0, "cost": 2, "win_rate": 47.9},
    {"id": "voidBolt", "voltage": 3.5, "resistance": 1.0, "cost": 2, "win_rate": 52.1},
    {"id": "entropyShield", "voltage": 1.0, "resistance": 4.5, "cost": 2, "win_rate": 48.2},
    {"id": "voidGate", "voltage": 2.5, "resistance": 2.0, "cost": 2, "win_rate": 51.0},
    {"id": "voidErosion", "voltage": 6.0, "resistance": 1.5, "cost": 3, "win_rate": 63.8}, # Deliberate OP outlier
    {"id": "rootTrap", "voltage": 2.0, "resistance": 3.0, "cost": 2, "win_rate": 49.8}
]

df = pd.DataFrame(data)
features = ["voltage", "resistance", "cost", "win_rate"]
X = df[features].values

# 2. Standardize numerical features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. Determine optimal cluster count using silhouette score
best_k = 3
best_score = -1
scores = {}

for k in range(2, 6):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    score = silhouette_score(X_scaled, labels)
    scores[k] = score
    if score > best_score:
        best_score = score
        best_k = k

print(f"[ML_BALANCE] Silhouette scores: {scores}")
print(f"[ML_BALANCE] Selected optimal k={best_k} with score {best_score:.4f}")

# 4. Perform clustering with optimal k
kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
df["cluster"] = kmeans.fit_predict(X_scaled)
centroids = kmeans.cluster_centers_

# 5. Outlier detection using Centroid Distance Thresholding
# Compute Euclidean distance to each point's cluster centroid
distances = []
for idx, row in df.iterrows():
    point = X_scaled[idx]
    centroid = centroids[row["cluster"]]
    dist = np.linalg.norm(point - centroid)
    distances.append(dist)

df["centroid_distance"] = distances

# Calculate Z-score of distance within each cluster
df["distance_zscore"] = 0.0
for c in range(best_k):
    cluster_mask = df["cluster"] == c
    c_dists = df.loc[cluster_mask, "centroid_distance"]
    if len(c_dists) > 1:
        mean_d = c_dists.mean()
        std_d = c_dists.std()
        if std_d > 0:
            df.loc[cluster_mask, "distance_zscore"] = (c_dists - mean_d) / std_d
    else:
        df.loc[cluster_mask, "distance_zscore"] = 2.0

# Flag outliers: Z-score > 1.5 and win_rate > 58.0%
df["is_outlier"] = (df["distance_zscore"] > 1.5) & (df["win_rate"] > 58.0)

# 6. Apply discrete adjustments to outliers
adjustments = {}
for idx, row in df.iterrows():
    if row["is_outlier"]:
        card_id = row["id"]
        adj_cost = min(10, int(row["cost"] + 1))
        adj_volts = row["voltage"] - 1.0 if row["voltage"] > 2.0 else row["voltage"]
        adj_res = row["resistance"] - 1.0 if row["resistance"] > 2.0 else row["resistance"]
        
        adjustments[card_id] = {
            "cost": adj_cost,
            "voltage": adj_volts,
            "resistance": adj_res
        }
        print(f"[ML_BALANCE] Flagged OP Outlier: {card_id} (Win Rate: {row['win_rate']}%). Recommended Adjustments: Cost -> {adj_cost}, V -> {adj_volts}, R -> {adj_res}")

# Write adjustments to server models directory
out_path = "/home/rhoddos_berger/Documents/Github/dusan-game/packages/server/src/models/rule_adjustments.json"
with open(out_path, "w") as f:
    json.dump(adjustments, f, indent=2)
print(f"[ML_BALANCE] Saved rule adjustments to {out_path}")

# 7. Dimensionality Reduction (PCA) for 2D visualization
pca = PCA(n_components=2 if len(features) > 2 else 1) # project to 2D
X_pca = pca.fit_transform(X_scaled)
df["pca_x"] = X_pca[:, 0]
df["pca_y"] = X_pca[:, 1]

# Scatterplot 1: Cluster Hue
plt.figure(figsize=(10, 8))
for c in range(best_k):
    cluster_df = df[df["cluster"] == c]
    plt.scatter(cluster_df["pca_x"], cluster_df["pca_y"], label=f"Cluster {c}", s=100)

# Mark outliers
outliers_df = df[df["is_outlier"]]
if not outliers_df.empty:
    plt.scatter(outliers_df["pca_x"], outliers_df["pca_y"], color='red', marker='x', s=200, label="OP Outlier", linewidths=3)

# Label card names
for idx, row in df.iterrows():
    plt.annotate(row["id"], (row["pca_x"] + 0.05, row["pca_y"] + 0.05), fontsize=8, alpha=0.8)

plt.title("Card Balancing - K-Means Clustering PCA Projection")
plt.xlabel("PCA Component 1")
plt.ylabel("PCA Component 2")
plt.legend()
plt.grid(True, alpha=0.3)
plot_path_clusters = os.path.join(ARTIFACT_DIR, "balance_clusters.png")
plt.savefig(plot_path_clusters)
plt.close()

# Scatterplot 2: Cost Hue
plt.figure(figsize=(10, 8))
scatter = plt.scatter(df["pca_x"], df["pca_y"], c=df["cost"], cmap="viridis", s=100)
plt.colorbar(scatter, label="Energy Cost")
for idx, row in df.iterrows():
    plt.annotate(row["id"], (row["pca_x"] + 0.05, row["pca_y"] + 0.05), fontsize=8, alpha=0.8)
plt.title("Card Balancing PCA Projection - Colored by Card Cost")
plt.xlabel("PCA Component 1")
plt.ylabel("PCA Component 2")
plt.grid(True, alpha=0.3)
plot_path_cost = os.path.join(ARTIFACT_DIR, "balance_cost_projection.png")
plt.savefig(plot_path_cost)
plt.close()

print("[ML_BALANCE] Analysis and visualizations completed successfully.")
