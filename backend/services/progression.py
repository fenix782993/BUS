def next_level_xp(level: int) -> int:
    return int(100 * (level ** 1.45))

def add_xp(player, amount: int):
    player.xp += max(0, int(amount))
    while player.xp >= next_level_xp(player.level + 1):
        player.level += 1
        player.reputation += 2
