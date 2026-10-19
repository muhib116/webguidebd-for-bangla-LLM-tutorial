# JavaScript: const prices = [1200, 950, 1850];
prices = [1200, 950, 1850]
names = ["নীল সুতি শাড়ি", "সবুজ কুর্তি", "লন থ্রি-পিস"]
stock = {"SAREE-BLUE": 8, "KURTI-GRN": 3, "LAWN-3PC": 0}


def total(items, delivery=0):
    """items: (দাম, পরিমাণ) জোড়ার তালিকা; delivery-র ডিফল্ট মান 0"""
    return sum(price * qty for price, qty in items) + delivery


print("মোট:", total([(1200, 2), (950, 1)], delivery=130))

in_stock = [sku for sku, n in stock.items() if n > 0]
print("স্টকে আছে:", in_stock)

for i, name in enumerate(names):
    print(f"{i}: {name} — {prices[i]:,} টাকা")

print("None ও bool:", None is None, True and not False)
print("ভাগ:", 7 / 2, 7 // 2, 7 % 2, 2 ** 10)
print("ঋণাত্মক:", -7 // 2, -7 % 3)
print("স্লাইস:", prices[1:], prices[-1], len(names[0]))

try:
    stock["SCARF-RED"]
except KeyError as e:
    print("KeyError:", e)
print("get:", stock.get("SCARF-RED", "নেই"))

a = [1, 2]
b = a
b.append(3)
print("একই তালিকা:", a, "| কপি:", a.copy() is a)
