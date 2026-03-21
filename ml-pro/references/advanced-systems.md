# Advanced Systems Reference

## Reinforcement Learning

### stable-baselines3 Quick Start
```python
import stable_baselines3 as sb3

# PPO (default choice)
model = sb3.PPO('MlpPolicy', env,
    learning_rate=3e-4, n_steps=2048, batch_size=64,
    n_epochs=10, gamma=0.99, gae_lambda=0.95, clip_range=0.2)
model.learn(total_timesteps=1_000_000)

# DQN (discrete actions)
model = sb3.DQN('MlpPolicy', env,
    learning_rate=1e-4, buffer_size=100_000,
    learning_starts=10_000, batch_size=32, tau=0.005)

# SAC (continuous control)
model = sb3.SAC('MlpPolicy', env,
    learning_rate=3e-4, buffer_size=1_000_000, batch_size=256)
```

### Custom Environment
```python
import gymnasium as gym

class CustomEnv(gym.Env):
    def __init__(self):
        self.observation_space = gym.spaces.Box(low=-1, high=1, shape=(4,))
        self.action_space = gym.spaces.Discrete(3)

    def reset(self, seed=None):
        self.state = np.zeros(4)
        return self.state, {}

    def step(self, action):
        reward = compute_reward(self.state, action)
        done = check_done(self.state)
        return self.state, reward, done, False, {}
```

### Thompson Sampling (Contextual Bandits)
```python
class ThompsonBandit:
    def __init__(self, n_arms):
        self.alpha = np.ones(n_arms)
        self.beta_param = np.ones(n_arms)

    def select(self):
        samples = [np.random.beta(a, b)
                   for a, b in zip(self.alpha, self.beta_param)]
        return np.argmax(samples)

    def update(self, arm, reward):
        self.alpha[arm] += reward
        self.beta_param[arm] += 1 - reward
```

## Knowledge Graph Embeddings (PyKEEN)

```python
from pykeen.pipeline import pipeline
from pykeen.triples import TriplesFactory

tf = TriplesFactory.from_path("triples.tsv",
    create_inverse_triples=True)
train, test = tf.split([0.8, 0.2])

result = pipeline(
    training=train, testing=test,
    model="RotatE",
    model_kwargs=dict(embedding_dim=200),
    training_kwargs=dict(num_epochs=200, batch_size=256),
    optimizer_kwargs=dict(lr=1e-3),
    negative_sampler="basic",
    negative_sampler_kwargs=dict(num_negs_per_pos=128),
)
result.save_to_directory("kge_output")
```

### Model Selection Guide
| Model | Relation Patterns | Notes |
|---|---|---|
| TransE | Antisymmetric, inversion | Simple, fast |
| RotatE | +Symmetric, composition | Good default |
| ComplEx | +Asymmetric | Complex-valued |
| DistMult | Symmetric only | Use with GNN encoder |
| TuckER | All | Most expressive, most params |

## Contrastive Learning

### InfoNCE Loss
```python
def info_nce_loss(z_i, z_j, temperature=0.07):
    B = z_i.shape[0]
    z = torch.cat([z_i, z_j], dim=0)
    z = F.normalize(z, dim=1)
    sim = z @ z.T / temperature
    mask = torch.eye(2 * B, device=z.device).bool()
    sim.masked_fill_(mask, -1e9)
    labels = torch.cat([torch.arange(B, 2*B), torch.arange(B)]).to(z.device)
    return F.cross_entropy(sim, labels)
```

### Triplet Loss
```python
loss_fn = nn.TripletMarginLoss(margin=1.0, p=2)
loss = loss_fn(anchor_emb, positive_emb, negative_emb)
```

### Sentence Embeddings
```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer('all-MiniLM-L6-v2')
train_examples = [InputExample(texts=['sent1', 'sent2'], label=0.8)]
train_dataloader = DataLoader(train_examples, batch_size=16)
train_loss = losses.CosineSimilarityLoss(model)
model.fit(train_objectives=[(train_dataloader, train_loss)], epochs=1)
```

## Diffusion Models

### Training Step
```python
def diffusion_train_step(model, x0, noise_schedule):
    t = torch.randint(0, T, (x0.size(0),), device=x0.device)
    noise = torch.randn_like(x0)
    alpha_bar = noise_schedule.alpha_bar[t].view(-1, 1, 1, 1)
    x_noisy = torch.sqrt(alpha_bar) * x0 + torch.sqrt(1 - alpha_bar) * noise
    noise_pred = model(x_noisy, t)
    return F.mse_loss(noise_pred, noise)
```

### HuggingFace Diffusers
```python
from diffusers import StableDiffusionPipeline
pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
pipe.to("cuda")
image = pipe("a photo of an astronaut riding a horse").images[0]
```

## Evolutionary Optimization

### Optuna
```python
import optuna

def objective(trial):
    lr = trial.suggest_float('lr', 1e-5, 1e-2, log=True)
    hidden = trial.suggest_int('hidden', 64, 512, step=64)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)
    return train_and_eval(lr, hidden, dropout)

study = optuna.create_study(direction='minimize',
    pruner=optuna.pruners.MedianPruner(n_warmup_steps=5))
study.optimize(objective, n_trials=100, n_jobs=4)
```

### CMA-ES
```python
import cma
es = cma.CMAEvolutionStrategy(x0, 0.5)
while not es.stop():
    solutions = es.ask()
    fitnesses = [evaluate(s) for s in solutions]
    es.tell(solutions, fitnesses)
best = es.result.xbest
```

### DEAP (NSGA-II Multi-Objective)
```python
from deap import base, creator, tools, algorithms
creator.create("FitnessMulti", base.Fitness, weights=(-1.0, -1.0))
# Register operators, run eaMuPlusLambda
```

## Meta-Learning (MAML)

```python
import learn2learn as l2l

maml = l2l.algorithms.MAML(model, lr=0.01, first_order=True)
opt = torch.optim.Adam(maml.parameters(), lr=0.001)

for task in task_batch:
    learner = maml.clone()
    for x, y in task.support:
        loss = F.cross_entropy(learner(x), y)
        learner.adapt(loss)
    query_loss = F.cross_entropy(learner(task.query_x), task.query_y)
    query_loss.backward()
opt.step(); opt.zero_grad()
```

## Bayesian Deep Learning

### MC Dropout
```python
model.train()  # keep dropout on
preds = torch.stack([model(x) for _ in range(50)])
mean, var = preds.mean(0), preds.var(0)
```

### Deep Ensembles
```python
models = [train_model(seed=i) for i in range(5)]
preds = torch.stack([m(x) for m in models])
mean, var = preds.mean(0), preds.var(0)
```

## DSPy (Modular LM Programs)

```python
import dspy

class RAG(dspy.Module):
    def __init__(self):
        self.retrieve = dspy.Retrieve(k=3)
        self.generate = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        context = self.retrieve(question).passages
        return self.generate(context=context, question=question)
```

## Neuro-Symbolic

### PyReason (Defeasible Logic over Graphs)
```python
import pyreason
pyreason.add_rule("trusted(X) <- published_in(X, peer_reviewed)")
pyreason.add_rule("~trusted(X) <- retracted(X)")
result = pyreason.reason(graph, max_steps=10)
```
