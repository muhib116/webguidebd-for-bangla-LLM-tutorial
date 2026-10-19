import os
import tempfile

import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(0)
torch.set_num_threads(1)

# সিন্থেটিক ডেটা: y = 3x + 2 + noise
X = torch.rand(200, 1) * 4 - 2
Y = 3 * X + 2 + 0.3 * torch.randn(200, 1)
train_ds = TensorDataset(X[:160], Y[:160])
val_X, val_Y = X[160:], Y[160:]

g = torch.Generator().manual_seed(0)
loader = DataLoader(train_ds, batch_size=16, shuffle=True, generator=g)
print("batch সংখ্যা প্রতি epoch:", len(loader))

model = nn.Linear(1, 1)
opt = torch.optim.SGD(model.parameters(), lr=0.1)
loss_fn = nn.MSELoss()

for epoch in range(30):
    model.train()
    for xb, yb in loader:
        opt.zero_grad()
        loss = loss_fn(model(xb), yb)
        loss.backward()
        opt.step()
    if epoch in (0, 9, 29):
        model.eval()
        with torch.no_grad():
            val = loss_fn(model(val_X), val_Y).item()
        print(f"epoch {epoch + 1:>2} | শেষ batch loss {loss.item():.4f} | val loss {val:.4f}")

w, b = model.weight.item(), model.bias.item()
print(f"শেখা w = {w:.3f}, b = {b:.3f} (আসল 3, 2)")
floor = loss_fn(3 * val_X + 2, val_Y).item()
print(f"আসল সূত্র (3x + 2) দিয়েও এই val সেটে loss {floor:.4f} — noise কোনো মডেল সরাতে পারে না")

with tempfile.TemporaryDirectory() as d:
    path = os.path.join(d, "ckpt.pt")
    torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "epoch": 30}, path)
    ck = torch.load(path)
    restored = nn.Linear(1, 1)
    restored.load_state_dict(ck["model"])
    same = torch.equal(restored(val_X), model(val_X))
    print("checkpoint থেকে ফেরানো মডেল একই আউটপুট দেয়:", same, "| epoch:", ck["epoch"])
