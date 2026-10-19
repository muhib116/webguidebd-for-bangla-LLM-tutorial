import random
import sys
from dataclasses import dataclass
from typing import Optional


@dataclass
class Product:
    sku: str
    name: str
    price: Optional[int]  # None = দাম অজানা
    stock: int

    def available(self, qty: int) -> bool:
        return self.stock >= qty


class Neuron:
    def __init__(self, weights, bias):
        self.w = list(weights)
        self.b = bias

    def __call__(self, x):
        z = sum(wi * xi for wi, xi in zip(self.w, x)) + self.b
        return max(0.0, z)  # ReLU

    def __repr__(self):
        return f"Neuron(w={self.w}, b={self.b})"


def main():
    p = Product("KURTI-GRN", "সবুজ কুর্তি", 950, 3)
    print(p)
    print("৫টি পাওয়া যাবে?", p.available(5))
    n = Neuron([2.0, -1.0], 0.5)
    print(n, "→", n([3.0, 4.0]), n([1.0, 4.0]))
    random.seed(42)
    print("random (seed 42):", [round(random.random(), 3) for _ in range(3)])
    print("Python", sys.version.split()[0])


if __name__ == "__main__":
    main()
