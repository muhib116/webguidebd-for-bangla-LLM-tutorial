import torch

torch.manual_seed(0)
t = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
print("shape:", tuple(t.shape), "| dtype:", t.dtype, "| device:", t.device)
print("পূর্ণসংখ্যা tensor-এর dtype:", torch.tensor([1, 2]).dtype)


def pick_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


print("এই কম্পিউটারে পাওয়া device:", pick_device(), "(নিচের হিসাব CPU-তে)")

# অধ্যায় ৩-এর সূত্র: L = (w·x + b − y)²
x, y = torch.tensor(3.0), torch.tensor(10.0)
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(0.5, requires_grad=True)
loss = (w * x + b - y) ** 2
loss.backward()
print("loss:", loss.item(), "| dL/dw:", w.grad.item(), "| dL/db:", b.grad.item())

loss2 = (w * x + b - y) ** 2
loss2.backward()
print("zero_grad ছাড়া দ্বিতীয় backward-এর পরে dL/dw:", w.grad.item())
w.grad.zero_()
b.grad.zero_()

with torch.no_grad():
    w -= 0.01 * torch.tensor(-21.0)
print("update-এর পরে w:", round(w.item(), 4), "| requires_grad:", w.requires_grad)

try:
    torch.randn(2, 3) @ torch.randn(2, 3)
except RuntimeError as e:
    print("RuntimeError:", str(e).splitlines()[0])
print("(2,3) @ (3,2) →", tuple((torch.randn(2, 3) @ torch.randn(3, 2)).shape))
print("PyTorch", torch.__version__)
