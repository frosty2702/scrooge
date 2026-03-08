"""
Custom PPO policy using Dirichlet distribution for portfolio weight actions.
Drop-in replacement: PPO(DirichletPolicy, env)
"""
from typing import Optional, Tuple, TypeVar

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Dirichlet

from stable_baselines3 import PPO
from stable_baselines3.common.policies import ActorCriticPolicy
from stable_baselines3.common.preprocessing import get_action_dim
from stable_baselines3.common.type_aliases import Schedule


SelfDirichletDistribution = TypeVar("SelfDirichletDistribution", bound="DirichletDistribution")

MIN_ALPHA = 0.1


class DirichletDistribution:
    """
    Dirichlet distribution for portfolio weights (continuous simplex actions).
    Alpha = softplus(raw) + MIN_ALPHA to ensure positive concentration parameters.
    """

    def __init__(self, action_dim: int):
        self.action_dim = action_dim
        self.distribution: Optional[Dirichlet] = None

    def proba_distribution_net(self, latent_dim: int) -> nn.Module:
        """Linear layer outputting raw alpha values (before softplus)."""
        return nn.Linear(latent_dim, self.action_dim)

    def proba_distribution(
        self: SelfDirichletDistribution, raw_alpha: torch.Tensor
    ) -> SelfDirichletDistribution:
        """Set alpha = softplus(raw) + MIN_ALPHA to prevent collapse."""
        alpha = F.softplus(raw_alpha) + MIN_ALPHA
        self.distribution = Dirichlet(alpha)
        return self

    def log_prob(self, actions: torch.Tensor) -> torch.Tensor:
        return self.distribution.log_prob(actions)

    def entropy(self) -> Optional[torch.Tensor]:
        return self.distribution.entropy()

    def sample(self) -> torch.Tensor:
        return self.distribution.sample()

    def mode(self) -> torch.Tensor:
        """Mode of Dirichlet: (alpha - 1) / (sum(alpha) - n), normalized."""
        alpha = self.distribution.concentration
        n = alpha.shape[-1]
        mode = (alpha - 1).clamp(min=1e-6)
        mode_sum = mode.sum(dim=-1, keepdim=True)
        if (mode_sum < 1e-6).any():
            return torch.ones_like(alpha) / n
        return mode / mode_sum

    def get_actions(self, deterministic: bool = False) -> torch.Tensor:
        if deterministic:
            return self.mode()
        return self.sample()

    def actions_from_params(
        self, raw_alpha: torch.Tensor, deterministic: bool = False
    ) -> torch.Tensor:
        self.proba_distribution(raw_alpha)
        return self.get_actions(deterministic=deterministic)

    def log_prob_from_params(
        self, raw_alpha: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        actions = self.actions_from_params(raw_alpha)
        log_prob = self.log_prob(actions)
        return actions, log_prob


class DirichletPolicy(ActorCriticPolicy):
    """ActorCriticPolicy with Dirichlet action distribution for portfolio weights."""

    def _build(self, lr_schedule: Schedule) -> None:
        super()._build(lr_schedule)

        # Replace action dist with Dirichlet (parent uses DiagGaussian for Box)
        action_dim = get_action_dim(self.action_space)
        self.action_dist = DirichletDistribution(action_dim)
        latent_dim_pi = self.mlp_extractor.latent_dim_pi

        # Single action net for alpha (replaces mean + log_std)
        self.action_net = self.action_dist.proba_distribution_net(latent_dim_pi)

    def _predict(self, observation: torch.Tensor, deterministic: bool = False) -> torch.Tensor:
        return self.get_distribution(observation).get_actions(deterministic=deterministic)

    def forward(
        self,
        obs: torch.Tensor,
        deterministic: bool = False,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        latent_pi, latent_vf = self.mlp_extractor(self.extract_features(obs))
        distribution = self._get_action_dist_from_latent(latent_pi)
        actions = distribution.get_actions(deterministic=deterministic)
        log_prob = distribution.log_prob(actions)
        values = self.value_net(latent_vf)
        return actions, values, log_prob

    def _get_action_dist_from_latent(self, latent_pi: torch.Tensor) -> DirichletDistribution:
        raw_alpha = self.action_net(latent_pi)
        return self.action_dist.proba_distribution(raw_alpha)

    def evaluate_actions(
        self,
        obs: torch.Tensor,
        actions: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        latent_pi, latent_vf = self.mlp_extractor(self.extract_features(obs))
        distribution = self._get_action_dist_from_latent(latent_pi)
        log_prob = distribution.log_prob(actions)
        values = self.value_net(latent_vf)
        entropy = distribution.entropy()
        return values, log_prob, entropy

    def get_distribution(self, obs: torch.Tensor):
        features = self.extract_features(obs)
        latent_pi = self.mlp_extractor.forward_actor(features)
        return self._get_action_dist_from_latent(latent_pi)


class DirichletPPO(PPO):
    def train(self) -> None:
        # Patch: skip log_std logging which doesn't exist for Dirichlet
        original_record = self.logger.record

        def patched_record(key, value, *args, **kwargs):
            if key == "train/std":
                return
            return original_record(key, value, *args, **kwargs)

        self.logger.record = patched_record
        super().train()
        self.logger.record = original_record
