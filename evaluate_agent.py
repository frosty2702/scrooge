import gymnasium as gym
import matplotlib.pyplot as plt
from stable_baselines3 import PPO
from trading_env import TradingEnv

if __name__ == "__main__":
    env = TradingEnv(csv_file="data/features.csv", window_size=20)
    model = PPO.load("models/ppo_trading_model")

    obs, _ = env.reset()
    portfolio_values = [env.portfolio_value]
    done = False

    while not done:
        action, _ = model.predict(obs)
        obs, reward, done, _, info = env.step(action)
        portfolio_values.append(info["portfolio_value"])

    plt.figure(figsize=(12,6))
    plt.plot(portfolio_values)
    plt.title("RL Portfolio Value Over Time")
    plt.xlabel("Step")
    plt.ylabel("Portfolio Value")
    plt.grid(True)
    plt.savefig("plots/rl_portfolio_value.png")
    plt.show()

    print("Evaluation complete. Plot saved to plots/rl_portfolio_value.png")