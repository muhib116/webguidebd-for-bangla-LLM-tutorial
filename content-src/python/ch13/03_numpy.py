import numpy as np

X = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
print("shape:", X.shape, "dtype:", X.dtype)
print("X @ X.T =", (X @ X.T).tolist())

b = np.array([10.0, 20.0, 30.0])
print("(2,3) + (3,)  →", (X + b).tolist())
col = np.array([[100.0], [200.0]])
print("(2,3) + (2,1) →", (X + col).tolist())

try:
    X - X.mean(axis=1)  # (2,3) - (2,) → শেষ মাত্রা 3 বনাম 2
except ValueError as e:
    print("ValueError:", e)
centered = X - X.mean(axis=1, keepdims=True)  # (2,3) - (2,1)
print("keepdims দিয়ে:", centered.tolist())


def softmax_rows(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)


S = softmax_rows(np.array([[2.0, 1.0, 0.0], [1000.0, 0.0, 0.0]]))
print("softmax:", np.round(S, 3).tolist(), "| সারির যোগ:", S.sum(axis=1).tolist())

rng = np.random.default_rng(0)
W = rng.normal(0, 1, size=(3, 4))
print("W shape:", W.shape, "| (2,3) @ (3,4) →", (X @ W).shape)
print("NumPy", np.__version__)
