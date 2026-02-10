# Clerk Router

A lightweight, custom routing library for React applications.

## Features

- **Framework Agnostic**: Can be adapted to work with any navigation backend (Hash, History API, Virtual).
- **Component-Based**: Provides `Route`, `Switch`, and `Router` components similar to `react-router`.
- **Lightweight**: Minimal dependencies and overhead.

## Components

- `BaseRouter`: The core provider that accepts `currentPath` and `navigate` prop.
- `HashRouter`: A wrapper that uses `window.location.hash` for navigation.
- `PathRouter`: A wrapper that uses `window.location.pathname` (History API).
- `VirtualRouter`: A router that keeps state in memory (useful for testing or embedded flows).
- `Switch`: Renders the first matching `Route` child.
- `Route`: Renders content if the path matches.

## Usage

```tsx
import { HashRouter, Switch, Route } from './clerk-router';

function App() {
  return (
    <HashRouter>
      <Switch>
        <Route path="/" exact>Home</Route>
        <Route path="/about">About</Route>
        <Route path="/users/:id">User Profile</Route>
      </Switch>
    </HashRouter>
  );
}
```
