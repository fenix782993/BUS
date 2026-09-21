"""Payment provider adapter. No provider is enabled by default; donation orders stay pending until a verified webhook credits FC."""
def create_pending_order(player_id,package,coins,amount): return {"player_id":player_id,"package":package,"coins":coins,"amount":amount,"status":"pending"}
