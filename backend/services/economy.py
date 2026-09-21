def can_spend(balance,amount): return balance >= amount
def spend(balance,amount):
    if not can_spend(balance,amount): raise ValueError("Недостаточно средств")
    return balance-amount
