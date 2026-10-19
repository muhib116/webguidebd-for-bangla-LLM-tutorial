import torch
from torch import nn

torch.manual_seed(1)
torch.set_num_threads(1)


def imul(a, b):
    return (a * b) & 0xFFFFFFFF


def make_rng(seed):
    """অধ্যায় ৫-এর JavaScript makeRng (mulberry32)-এর হুবহু Python রূপ।"""
    a = seed & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return rnd


rand = make_rng(77)


def gen(n):
    pts, labels = [], []
    for _ in range(n):
        x = [rand() * 2 - 1, rand() * 2 - 1]
        pts.append(x)
        labels.append(1.0 if x[0] ** 2 + x[1] ** 2 < 0.5 else 0.0)
    return torch.tensor(pts), torch.tensor(labels).unsqueeze(1)


Xtr, Ytr = gen(160)
Xte, Yte = gen(80)
print("প্রথম বিন্দু:", [round(v, 3) for v in Xtr[0].tolist()], "| train-এ ভেতরের বিন্দু:", int(Ytr.sum().item()))
zero_acc = (Yte == 0).float().mean().item()
print("test-এ “সব 0”:", round(zero_acc, 4), "(অধ্যায় ৫-এর QuickJS ফল 0.5875—একই ডেটা)")


def acc(model, X, Y):
    with torch.no_grad():
        return ((model(X) >= 0.5).float() == Y).float().mean().item()


def train(model, epochs=800, lr=0.5):
    opt = torch.optim.SGD(model.parameters(), lr=lr)
    loss_fn = nn.BCELoss()
    for e in range(epochs):
        opt.zero_grad()
        loss = loss_fn(model(Xtr), Ytr)
        loss.backward()
        opt.step()
        if e in (0, 100, epochs - 1):
            print(f"  epoch {e:>3} loss {loss.item():.3f}")
    return model


print("2→8→1 (tanh, sigmoid):")
net = train(nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 1), nn.Sigmoid()))
print("logistic regression (hidden নেই):")
logreg = train(nn.Sequential(nn.Linear(2, 1), nn.Sigmoid()))
print(f"test accuracy → neural net {acc(net, Xte, Yte):.4f} | logistic {acc(logreg, Xte, Yte):.4f} | সব 0 {zero_acc:.4f}")
print("parameter সংখ্যা:", sum(p.numel() for p in net.parameters()))
