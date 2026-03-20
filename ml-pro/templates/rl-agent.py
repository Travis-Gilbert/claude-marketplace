"""
RL Agent Template (stable-baselines3)
========================================
Custom environment + PPO/DQN/SAC training with reward shaping.
"""

from dataclasses import dataclass
from typing import Optional

import gymnasium as gym
import numpy as np
import stable_baselines3 as sb3
from stable_baselines3.common.callbacks import EvalCallback
from stable_baselines3.common.monitor import Monitor


@dataclass
class RLConfig:
    algorithm: str = "PPO"          # PPO, DQN, SAC
    total_timesteps: int = 1_000_000
    lr: float = 3e-4
    batch_size: int = 64
    gamma: float = 0.99
    # PPO-specific
    n_steps: int = 2048
    n_epochs: int = 10
    clip_range: float = 0.2
    gae_lambda: float = 0.95
    # DQN-specific
    buffer_size: int = 100_000
    learning_starts: int = 10_000
    exploration_fraction: float = 0.1
    # Eval
    eval_freq: int = 10_000
    n_eval_episodes: int = 10
    log_dir: str = "rl_logs"
    model_dir: str = "rl_models"


# === Custom Environment (replace with yours) ===

class CustomEnv(gym.Env):
    """
    Replace with your environment. Must implement:
    - __init__: set observation_space, action_space
    - reset: return (observation, info)
    - step: return (observation, reward, terminated, truncated, info)
    """
    metadata = {"render_modes": ["human"]}

    def __init__(self):
        super().__init__()
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(4,), dtype=np.float32)
        self.action_space = gym.spaces.Discrete(3)
        self.state = None
        self.steps = 0
        self.max_steps = 200

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.state = self.np_random.uniform(-0.5, 0.5, size=(4,)).astype(np.float32)
        self.steps = 0
        return self.state, {}

    def step(self, action):
        # Replace with your dynamics
        self.state = self.state + self.np_random.normal(0, 0.1, size=(4,)).astype(np.float32)
        self.steps += 1

        reward = -np.abs(self.state).sum()  # reward for being near origin
        terminated = bool(np.abs(self.state).max() > 5.0)
        truncated = self.steps >= self.max_steps

        return self.state, reward, terminated, truncated, {}


# === Reward Shaping Wrapper ===

class RewardShapingWrapper(gym.Wrapper):
    """Adds potential-based reward shaping."""

    def __init__(self, env, shaping_fn=None, shaping_weight=0.1):
        super().__init__(env)
        self.shaping_fn = shaping_fn or self._default_shaping
        self.shaping_weight = shaping_weight
        self.prev_potential = 0.0

    def reset(self, **kwargs):
        obs, info = self.env.reset(**kwargs)
        self.prev_potential = self.shaping_fn(obs)
        return obs, info

    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        current_potential = self.shaping_fn(obs)
        shaped_reward = reward + self.shaping_weight * (
            current_potential - self.prev_potential)
        self.prev_potential = current_potential
        info["raw_reward"] = reward
        return obs, shaped_reward, terminated, truncated, info

    @staticmethod
    def _default_shaping(obs):
        return -np.abs(obs).sum()


# === Training ===

def train_rl(config: RLConfig, env_cls=CustomEnv):
    # Create environments
    train_env = Monitor(env_cls())
    eval_env = Monitor(env_cls())

    # Optional reward shaping
    # train_env = RewardShapingWrapper(train_env)

    # Select algorithm
    algo_cls = getattr(sb3, config.algorithm)

    common_kwargs = dict(
        env=train_env,
        learning_rate=config.lr,
        gamma=config.gamma,
        verbose=1,
        tensorboard_log=config.log_dir,
    )

    if config.algorithm == "PPO":
        model = algo_cls(
            "MlpPolicy", **common_kwargs,
            n_steps=config.n_steps,
            batch_size=config.batch_size,
            n_epochs=config.n_epochs,
            clip_range=config.clip_range,
            gae_lambda=config.gae_lambda,
        )
    elif config.algorithm == "DQN":
        model = algo_cls(
            "MlpPolicy", **common_kwargs,
            buffer_size=config.buffer_size,
            learning_starts=config.learning_starts,
            batch_size=config.batch_size,
            exploration_fraction=config.exploration_fraction,
        )
    elif config.algorithm == "SAC":
        model = algo_cls(
            "MlpPolicy", **common_kwargs,
            buffer_size=config.buffer_size,
            batch_size=config.batch_size,
        )
    else:
        raise ValueError(f"Unknown algorithm: {config.algorithm}")

    # Eval callback
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path=config.model_dir,
        log_path=config.log_dir,
        eval_freq=config.eval_freq,
        n_eval_episodes=config.n_eval_episodes,
        deterministic=True,
    )

    # Train
    model.learn(
        total_timesteps=config.total_timesteps,
        callback=eval_callback,
    )

    # Save final model
    model.save(f"{config.model_dir}/final_model")
    print(f"Model saved to {config.model_dir}/")

    return model


def evaluate_rl(model_path: str, env_cls=CustomEnv, n_episodes: int = 100):
    model = sb3.PPO.load(model_path)  # adjust algorithm class
    env = env_cls()

    rewards = []
    for _ in range(n_episodes):
        obs, _ = env.reset()
        total_reward = 0
        done = False
        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, _ = env.step(action)
            total_reward += reward
            done = terminated or truncated
        rewards.append(total_reward)

    print(f"Mean reward: {np.mean(rewards):.2f} +/- {np.std(rewards):.2f}")
    return rewards


if __name__ == "__main__":
    config = RLConfig(algorithm="PPO", total_timesteps=100_000)
    model = train_rl(config)
    evaluate_rl(f"{config.model_dir}/best_model")
