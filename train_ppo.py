import gymnasium as gym
from stable_baselines3 import PPO
from trading_env import TradingEnv

if __name__ == "__main__":
    env = TradingEnv(csv_file="data/features.csv", window_size=20)

    model = PPO("MlpPolicy", env, verbose=1)
    model.learn(total_timesteps=50000)

    model.save("models/ppo_trading_model")
    print("PPO model trained and saved to models/ppo_trading_model.zip")