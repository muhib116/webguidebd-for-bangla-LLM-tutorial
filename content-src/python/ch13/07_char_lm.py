import math
import random

import torch
import torch.nn.functional as F
from torch import nn

torch.manual_seed(0)
torch.set_num_threads(1)
random.seed(0)

# সিন্থেটিক কর্পাস: টেমপ্লেট থেকে বানানো দোকানের বাক্য (কোনো আসল গ্রাহকের নয়)
items = ["শাড়ি", "কুর্তি", "ওড়না", "থ্রি-পিস", "পাঞ্জাবি"]
colors = ["নীল", "লাল", "সবুজ", "সাদা"]
templates = [
    "{c} {i} কি স্টকে আছে",
    "{c} {i} এর দাম কত",
    "{i} ঢাকার বাইরে কবে পাব",
    "আমি {c} {i} নিতে চাই",
    "{i} ফেরত দেওয়া যাবে কি",
]
sentences = sorted({t.format(c=c, i=i) for t in templates for c in colors for i in items})
random.shuffle(sentences)
split = int(0.8 * len(sentences))
train_s, val_s = sentences[:split], sentences[split:]
print("বাক্য:", len(sentences), "| train:", len(train_s), "| val:", len(val_s))

chars = sorted({ch for s in sentences for ch in s})
stoi = {ch: i + 1 for i, ch in enumerate(chars)}  # 0 = শুরু/শেষ চিহ্ন
itos = {i: ch for ch, i in stoi.items()}
itos[0] = "|"
V = len(stoi) + 1
print("vocabulary (কোড পয়েন্ট + চিহ্ন):", V)

CTX = 3


def make_xy(ss):
    xs, ys = [], []
    for s in ss:
        ctx = [0] * CTX
        for ch in list(s) + ["|"]:
            ix = stoi.get(ch, 0)
            xs.append(ctx)
            ys.append(ix)
            ctx = ctx[1:] + [ix]
    return torch.tensor(xs), torch.tensor(ys)


Xtr, Ytr = make_xy(train_s)
Xva, Yva = make_xy(val_s)
print("প্রশিক্ষণ-উদাহরণ:", len(Ytr), "| val:", len(Yva))

# baseline ১: uniform; baseline ২: bigram গণনা (add-1 smoothing)
print(f"uniform loss: {math.log(V):.3f}")
counts = torch.ones(V, V)
for a, b in zip(Xtr[:, -1].tolist(), Ytr.tolist()):
    counts[a, b] += 1
P = counts / counts.sum(1, keepdim=True)
bigram_val = -torch.log(P[Xva[:, -1], Yva]).mean().item()
print(f"bigram (গণনা) val loss: {bigram_val:.3f}")


class CharMLP(nn.Module):
    def __init__(self, V, d=16, h=128):
        super().__init__()
        self.emb = nn.Embedding(V, d)
        self.net = nn.Sequential(nn.Linear(CTX * d, h), nn.Tanh(), nn.Linear(h, V))

    def forward(self, x):
        return self.net(self.emb(x).view(x.shape[0], -1))


model = CharMLP(V)
print("parameter:", sum(p.numel() for p in model.parameters()))
opt = torch.optim.Adam(model.parameters(), lr=3e-3)
g = torch.Generator().manual_seed(0)
for step in range(1501):
    idx = torch.randint(0, len(Ytr), (64,), generator=g)
    loss = F.cross_entropy(model(Xtr[idx]), Ytr[idx])
    opt.zero_grad()
    loss.backward()
    opt.step()
    if step % 500 == 0:
        with torch.no_grad():
            tr = F.cross_entropy(model(Xtr), Ytr).item()
            va = F.cross_entropy(model(Xva), Yva).item()
        print(f"step {step:>4} | train {tr:.3f} | val {va:.3f}")


def sample(seed, max_len=40):
    gen = torch.Generator().manual_seed(seed)
    ctx, out = [0] * CTX, []
    for _ in range(max_len):
        with torch.no_grad():
            p = F.softmax(model(torch.tensor([ctx])), dim=-1)
        ix = torch.multinomial(p, 1, generator=gen).item()
        if ix == 0:
            break
        out.append(itos[ix])
        ctx = ctx[1:] + [ix]
    return "".join(out)


samples = [sample(s) for s in range(6)]
for s in samples:
    print("নমুনা:", s, "| train-এ হুবহু আছে" if s in train_s else ("| val-এ আছে" if s in val_s else "| নতুন বাক্য"))
