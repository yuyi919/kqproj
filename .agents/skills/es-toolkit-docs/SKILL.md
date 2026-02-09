---
name: "es-toolkit-docs"
description: "Documentation and usage examples for es-toolkit library. Invoke when writing game logic, data processing, or utility functions."
---

# es-toolkit Documentation

`es-toolkit` is a modern, high-performance lodash alternative.

## Common Usage

### Game Logic
- **`shuffle`**: Randomizes an array (e.g., deck shuffling).
  ```typescript
  import { shuffle } from 'es-toolkit';
  const deck = shuffle(['card1', 'card2', 'card3']);
  ```
- **`sample`**: Picks a random element (e.g., lucky draw).
  ```typescript
  import { sample } from 'es-toolkit';
  const randomPlayer = sample(players);
  ```

### Advanced Game Patterns
- **`cloneDeep`**: Essential for immutable game state updates and snapshots.
  ```typescript
  import { cloneDeep } from 'es-toolkit';
  // Create a snapshot before modifying state
  const nextState = cloneDeep(currentState);
  nextState.round += 1;
  ```
- **`keyBy`**: Optimizes player lookups (O(1)) by ID. Crucial for voting/targeting.
  ```typescript
  import { keyBy } from 'es-toolkit';
  const playerMap = keyBy(players, p => p.id);
  const target = playerMap['player-123']; // Fast access
  ```
- **`difference`**: Calculates state changes (e.g., newly dead players).
  ```typescript
  import { difference } from 'es-toolkit';
  const newlyDead = difference(prevAliveIds, currentAliveIds);
  ```
- **`intersection`**: Useful for verifying shared attributes or card interactions.
  ```typescript
  import { intersection } from 'es-toolkit';
  const commonCards = intersection(playerA.hand, playerB.hand);
  ```

### Data Processing
- **`groupBy`**: Groups elements by a key.
  ```typescript
  import { groupBy } from 'es-toolkit';
  const byRole = groupBy(players, p => p.role);
  // Result: { werewolf: [...], villager: [...] }
  ```
- **`last`**: Safely gets the last element of an array.
  ```typescript
  import { last } from 'es-toolkit';
  const latestMsg = last(messages);
  ```

### Utilities
- **`debounce`**: Delays function execution (e.g., search input).
  ```typescript
  import { debounce } from 'es-toolkit';
  const handleSearch = debounce((term) => search(term), 300);
  ```
- **`omit` / `pick`**: Selects or removes object properties.
  ```typescript
  import { omit } from 'es-toolkit';
  const publicUser = omit(user, ['password']);
  ```
