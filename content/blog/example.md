---
title: "Folio Theme"
date: 2025-11-14
draft: false
tags: ["math", "math.PR", "math.CA", "math.AT"]
categories: ["misc"]
showTOC: true
---

## 1. Introduction

Folio is a beautiful, extensible and typographically sound hugo theme[^1] for blogs and academic pages.

[^1]: Folio was designed by Akira Tanase.

---

## 2. Mathematics

### 2.1 Complex Analysis — Residue Theorem <a id="thm:residue"></a>

> **Theorem (Residue Theorem).**  
> Let $f$ be holomorphic on and inside a positively oriented simple closed contour $C$, except for finitely many isolated singularities $a_1,\dots,a_n$ inside $C$.  
> Then
>
> $$
> \int_C f(z)\,dz = 2\pi i \sum_{k=1}^n \operatorname{Res}(f, a_k).
> $$

---

### 2.2 Probability — Central Limit Theorem

> **Theorem (Central Limit Theorem).**  
> Let $X_1,X_2,\dots$ be i.i.d. with mean $\mu$ and variance $\sigma^2 > 0$.  
> Then
>
> $$
> \frac{1}{\sigma\sqrt{n}}
> \left( \sum_{k=1}^n X_k - n\mu \right)
> \xrightarrow{d} \mathcal{N}(0,1).
> $$

---

### 2.3 Algebraic Topology — Mayer–Vietoris

> **Theorem (Mayer–Vietoris, reduced homology).**  
> Let $X = U \cup V$ where $U$ and $V$ are open and path-connected. Then there is a natural long exact sequence:
>
> $$
> \begin{aligned}
> \cdots \\;\longrightarrow\\;
> \tilde H_n(U \cap V)
> &\xrightarrow{(i_\*,\, j_\*)}
> \tilde H_n(U) \oplus \tilde H_n(V)
> \xrightarrow{k_\* - \ell_\*}
> \tilde H_n(X)
> \\\
> &\xrightarrow{\partial}
> \tilde H_{n-1}(U \cap V)
> \\;\longrightarrow\\; \cdots
> \end{aligned}
> $$
>
> Intuitively, the homology of $X$ is reconstructed from that of $U$, $V$, and their overlap $U \cap V$.

---

## 3. Images

Over the summer, the Royal Albert Hall hosts BBC Proms (see [Figure 1](#fig:test-image)).

<figure id="fig:test-image" style="text-align:center;">
  <img src="/images/DSCF0770.jpg" alt="Test image" style="max-width:100%;">
  <figcaption><strong>Figure 1.</strong>The Royal Albert Hall</figcaption>
</figure>

---

## 4. Code Blocks

A C++ implementation of topological sort (DFS-based):

```cpp
  #include <bits/stdc++.h>
  using namespace std;

  void dfs(int v, vector<vector<int>> &g, vector<bool> &seen, vector<int> &order) {
      seen[v] = true;
      for (auto u : g[v]) {
          if (!seen[u]) dfs(u, g, seen, order);
      }
      order.push_back(v);
  }

  int main() {
      int n, m;
      cin >> n >> m;

      vector<vector<int>> g(n);
      for (int i = 0; i < m; i++) {
          int a, b;
          cin >> a >> b;
          g[a].push_back(b);
      }

      for (int i = 0; i < n; i++)
          sort(g[i].begin(), g[i].end());

      vector<bool> seen(n, false);
      vector<int> order;

      for (int v = 0; v < n; v++)
          if (!seen[v]) dfs(v, g, seen, order);

      reverse(order.begin(), order.end());

      for (int i = 0; i < n; i++) {
          cout << order[i];
          if (i + 1 < n) cout << " ";
      }
      cout << endl;
  }
```
