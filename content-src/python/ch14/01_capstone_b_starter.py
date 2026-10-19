"""Capstone B starter: baseline বনাম একটি নিয়ন্ত্রিত পরিবর্তন, একাধিক seed-এ।

প্রশ্ন: character-level MLP-তে context ৩ থেকে ৫ অক্ষর করলে val loss কমে কি,
আর নমুনায় train বাক্যের হুবহু কপি বাড়ে কি?
শুধু CTX বদলায়; ডেটা, ভাগ, step, lr, batch, মডেলের মাপ একই।
"""
import random
import statistics as st

import torch
import torch.nn.functional as F
from torch import nn

torch.set_num_threads(1)

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
random.Random(0).shuffle(sentences)  # ভাগ সব রানে একই (data seed 0)
split = int(0.8 * len(sentences))
train_s, val_s = sentences[:split], sentences[split:]
chars = sorted({ch for s in sentences for ch in s})
stoi = {ch: i + 1 for i, ch in enumerate(chars)}
itos = {i: ch for ch, i in stoi.items()}
V = len(stoi) + 1

CONFIG = {"steps": 1500, "batch": 64, "lr": 3e-3, "emb": 16, "hidden": 128, "samples": 20}


def make_xy(ss, ctx_len):
    xs, ys = [], []
    for s in ss:
        ctx = [0] * ctx_len
        for ch in list(s) + ["|"]:
            ix = stoi.get(ch, 0)
            xs.append(ctx)
            ys.append(ix)
            ctx = ctx[1:] + [ix]
    return torch.tensor(xs), torch.tensor(ys)


def run(ctx_len, emb, seed):
    torch.manual_seed(seed)
    Xtr, Ytr = make_xy(train_s, ctx_len)
    Xva, Yva = make_xy(val_s, ctx_len)
    model = nn.Sequential(
        nn.Embedding(V, emb),
        nn.Flatten(),
        nn.Linear(ctx_len * emb, CONFIG["hidden"]),
        nn.Tanh(),
        nn.Linear(CONFIG["hidden"], V),
    )
    opt = torch.optim.Adam(model.parameters(), lr=CONFIG["lr"])
    g = torch.Generator().manual_seed(seed)
    for _ in range(CONFIG["steps"]):
        idx = torch.randint(0, len(Ytr), (CONFIG["batch"],), generator=g)
        loss = F.cross_entropy(model(Xtr[idx]), Ytr[idx])
        opt.zero_grad()
        loss.backward()
        opt.step()
    with torch.no_grad():
        val = F.cross_entropy(model(Xva), Yva).item()
    copies = 0
    gen = torch.Generator().manual_seed(1000 + seed)
    for _ in range(CONFIG["samples"]):
        ctx, out = [0] * ctx_len, []
        for _ in range(40):
            with torch.no_grad():
                p = F.softmax(model(torch.tensor([ctx])), dim=-1)
            ix = torch.multinomial(p, 1, generator=gen).item()
            if ix == 0:
                break
            out.append(itos[ix])
            ctx = ctx[1:] + [ix]
        copies += "".join(out) in train_s
    params = sum(p.numel() for p in model.parameters())
    return val, copies / CONFIG["samples"], params


SEEDS = [0, 1, 2]
RUNS = [
    ("baseline CTX=3", 3, CONFIG["emb"]),
    ("পরিবর্তন CTX=5", 5, CONFIG["emb"]),
    ("নিয়ন্ত্রণ CTX=5 emb=10", 5, 10),  # parameter প্রায় baseline-এর সমান
]
results = {}
for name, ctx_len, emb in RUNS:
    rows = [run(ctx_len, emb, s) for s in SEEDS]
    results[name] = rows
    for s, (val, cp, params) in zip(SEEDS, rows):
        print(f"{name} | seed {s} | val loss {val:.3f} | train-কপি {cp:.2f} | parameter {params}")

print("config:", CONFIG, "| seeds:", SEEDS)
for name, rows in results.items():
    vals = [r[0] for r in rows]
    cps = [r[1] for r in rows]
    print(f"{name}: val loss গড় {st.mean(vals):.3f} ± {st.stdev(vals):.3f} (sd) | train-কপি গড় {st.mean(cps):.2f}")
base = results["baseline CTX=3"]
for name in list(results)[1:]:
    diffs = [b[0] - a[0] for a, b in zip(base, results[name])]
    print(f"seed ধরে পার্থক্য ({name} − baseline):", [round(d, 3) for d in diffs])
