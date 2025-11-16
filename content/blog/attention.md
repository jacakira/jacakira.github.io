---
title: "Understanding the Transformer"
date: 2025-11-15
tags: ["ml", "ml.attention", "ml.transformer"]
categories: ["mathematics"]
draft: false
showTOC: true
description: "Transformers are the powerful architecture behind LLMs. We take a deep-dive into how they work."
---

## Introduction

Prior to 2017, the state of the art for machine translation was the Recurrent Neural Networks (RNNs) and in particular variants such as Long Short-Term Memory Networks (LSTMs).[^LSTM] Whilst somewhat effective, they suffered from lack of long-term memory and understanding of context. The landmark paper, Attention is All You Need [^AAYN], introduced the transformer, which used combination of attention blocks and multi-layer perceptrons to achieve state of the art performance. The popularity of transformers has since exploded, in part due to their role as the architecture underpinning Large Language Models[^GPT].

[^AAYN]: Read the original paper here: [Attention Is All You Need, Vaswani Et.Al (2017)](https://arxiv.org/abs/1706.03762)
[^GPT]: The 'T' in 'GPT' stands for Transformer!
[^LSTM]: [Long Short-Term Memory, Hochreiter Et. Al (1997)](https://www.researchgate.net/publication/13853244_Long_Short-Term_Memory). Christoper Olah's [blog post](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) is an excellent introduction.


### Formalisation of the problem

In machine translation and sentence generation tasks, our aim is to model sequences
$$
(x_1, \dots, x_n) \mapsto (y_1, \dots, y_m),
$$

where {{< math display="false" >}}x_i \in \mathcal{V}_{\mathrm{src}}{{< /math >}} and {{< math display="false" >}}y_j \in \mathcal{V}_{\mathrm{tgt}}{{< /math >}} are tokens (typically words, subwords, characters etc.), where {{< math display="false" >}}\mathcal{V}_{\mathrm{src}}{{< /math >}} and {{< math display="false" >}}\mathcal{V}_{\mathrm{tgt}}{{< /math >}} are the source and target vocabularies respectively.

A neural sequence model will give us conditional distributions such as

$$
p(y_{1:m} \mid x_{1:n}) = \prod_{t = 1}^m p(y_t \mid y_{< t}, x_{1:n}),
$$

or, for language models

$$
p(x_{1:n}) = \prod_{t=1}^n p(x_t \mid x_{< t}).
$$

The transformer gives us a way to parametrize these conditional distributions.


### The problem with RNNs

RNNs work by processing sequences step by step

$$
h_t = f(h_{t-1}, x_t; \theta), \quad t = 1, \dots, n
$$

with some initial state $h_0$. Outputs are given as

$$
y_t = g(h_t; \theta^{\prime}).
$$

Crucially, we have sequential dependence. This brings with it certain issues

[todo]
1. No parallelism across time: RNN's compute $h_t$ only after $h_{t-1}$.
2. Information bottleneck: all information must flow through the recurrent state vector.
3. Gradient issues: the Jacobian $\partial h_t/ \partial h_{t-1}$ is multiplied repeatedly over $t$ which can lead to vanishing and exploding gradients.

The transformer architecture rectifies these issues.

## Encoding

The first stage of the transformer is the encoding step, which are maps each token $x_i$ into a continuous vector space. Given our source sequence

$$
(x_1, \dots, x_n), \quad x_i \in \mathcal{V}
$$

we map each token to a learned embedding

$$
e_i = E[x_i] \in \mathbb{R}^d
$$

via an embedding matrix $E \in \mathbb{R}^{\lvert \mathcal{V} \rvert \times d}$. We then augment the embedding via positional information $p_i$ (explained [later](#positional-encoding)) and scale it by $\sqrt{d}$, which keeps the variance of the embeddings and positional encodings comparable. From this we obtain

$$
h_i^{(0)} = \sqrt{d}e_i + p_i
$$

which forms our input $H^(0) = (h_1^{(0)}, \dots, h_n^{(0)})$ to the first encoding layer.

## Attention

### Scaled dot-product attention

#### Per-position View

The key mechanism behind the transformer architecture is attention.

Suppose we have a collection of input vectors, $x_1, \cdots, x_k \in \mathbb{R}^d$. The attention mechanism allows one vector (a query) to retrieve information from other vectors based on how well they match certain keys.

Attention starts with projecting our inputs into three spaces

- Queries, $Q_i = x_i W^Q$: what position $i$ is looking for;
- Keys, $K_j = x_j W^K$: what position $j$ offers;
- Values, $V_j = x_j W^V$: the actual content to aggregate from position $j$.

where $d$ is the model dimension and $W^Q, W^k \in \mathbb{R}^{d \times d_k}$ and $W^V \in \mathbb{R}^{d \times d_v}$ are learned matrices. Once we have obtained this, we can compute a similarity score $s_{ij}$, which determines to what degree the input at position $j$ should influence position $i$. Noting that the dot product of vectors is a measure of how 'aligned' two vectors are, a natural way of defining the similarity is

$$
s_{ij} = \frac{Q_i \cdot K_j}{\sqrt{d_k}}
$$

where we normalise the similarity via $\sqrt{d_k}$[^scaling].

[^scaling]: 
    Assume that each component of $Q_i$ and $K_j$ is i.i.d with zero mean and variance $\sigma^2$. Then,
    $$
    Q_i \cdot K_j = \sum_{l = 1}^{d_k} Q_{i, l}K_{j, l} \\, \implies \\,\operatorname{Var}(Q_i \cdot K_j) \approx d_k \sigma^4
    $$
    Thus, the typical magnitude of the dot product grows with $\mathcal{O}(\sqrt{d_k})$, causing the attention logits (the unnormalised scores) to increase with dimension. 


Furthermore, we can pass these computed scores through a softmax function, from which we obtain a probability distribution for the degree to which input $j$ influences input $i$.

{{< math >}}
a_{ij}
=
\frac{\exp(s_{ij})}{
\sum_{j'} \exp(s_{ij'})
}.
{{< /math >}}

This gives us our output at position $i$ as

$$
z_i = \sum_{j = 1}^n a_{ij} V_j \in \mathbb{R}^{d_v}.
$$

That is, each $z_i$ is given by a convex combination of the $V_j$'s, where the coefficients depend on how aligned query $Q_i$ is with the key $K_j$.

#### Matrix Form

Let $Q, K, V$ be matrices stacking the queries, keys and values

$$
Q \in \mathbb{R}^{n \times d_K}, \quad, K \in \mathbb{R}^{n \times d_k}, \quad V \in \mathbb{R}^{n \times d_v}.
$$

Then, the similarity matrix, $S$ is

{{< math >}}
S = \frac{QK^{\top}}{\sqrt{d_k}} \in \mathbb{R}^{n \times n}.
{{< /math >}}

Applying row-wise softmax, we obtain

{{< math >}}
A = \operatorname{softmax}(S) \in \mathbb{R}^{n \times n}.
{{< /math >}}

and our output matrix is

$$
Z = AV \in \mathbb{R}^{n \times d_v}.
$$

That is,

{{< math >}}
\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V.
{{< /math >}}

### Self-Attention

In self-attention, the queries, keys and values all come from the same sequence $X$. That is, given $X \in \mathbb{R}^{n \times d}$, we obtain
$$
Q = XW^Q, \quad K = XW^K, \quad V = XW^V.
$$

Thus, position $i$ can attend to any position $j$ in the same sequence[^autoregressive]. This allows modelling of long range dependencies in a single step, which is in stark contrast to RNNs, where the step count is proportional to their distance.

[^autoregressive]: In autoregressive models, such as language models, the token at position $i$ must only depend on the tokens preceding it. Thus, we must apply a mask, $M$, to the similarity matrix 

    {{< math >}}
    S = \frac{QK^{\top}}{\sqrt{d_k}} + M
    {{< /math >}}

    where 

    {{< math >}}
    M_{ij} = 
    \begin{cases}
    0, \qquad \,\, j \leq i,\\
    -\infty, \quad j > i.
    \end{cases}
    {{< /math >}}

    Noting that once softmax is applied, the $-\infty$ entires become zeros.



### Multi-Head Attention

Up till now, our single attention operation compresses everything into a single set of weights $\\{a_{ij}\\}$. Multi-head attention lets our model learn multiple notions of similarity in parallel.

We begin by choosing $H$ heads. For each head $h \in \\{1, \dots, H\\}$, we define learned matrices

$$
W_h^Q, W_h^K \in \mathbb{R}^{d \times d_k}, \quad W_h^V \in \mathbb{R}^{d \times d_v}.
$$

Furthermore, given $X \in \mathbb{R}^{n \times d}$, 

$$
Q_h = XW_h^Q,\quad K_h = XW_h^K, \quad V_h = XW_h^V.
$$

Head $h$ will output

$$
Z_h = \operatorname{Attention}(Q_h, K_h, V_h) \in \mathbb{R}^{n \times d_V}.
$$

We concatenate the heads to form 

$$
Z_{\operatorname{concat}} = [Z_1 \mid Z_2 \mid \dots \mid Z_h] \in \mathbb{R}^{n \times Hd_v}.
$$

At this point, our concatenated matrix $Z_{\operatorname{concat}}$ forms a block-structure where each head occupies a fixed slice of our matrix. We introduce a learned projection, $W^O \in \mathbb{R}^{Hd_v \times d}$ which mixes the head outputs. In effect, our model may form arbitrary linear combinations of the edges, and extract the diverse similarity patterns from each head into a single coherent representation.

$$
\operatorname{MHA}(X) = Z_{\operatorname{concat}} W^O.
$$

Typically we set

$$
d_k = d_v = d/H
$$

So that the concatenated dimension equals the model dimension.

Crucially, we note that despite the identical architecture, every head learns different notions of similarity. Firstly, the parameters are initialised independently, and these differences are amplified by passing through softmax. Furthermore, during the training stage, our projection matrix $W^O$ routes distinct gradient signals to each head, such that each head effectively optimises a different objective. Some heads will learn local structure, whilst others will learn long range patterns.

## Positional Encoding

Armed with knowledge of attention, we return to the positional encoding mentioned [earlier](#encoding).

Since self-attention is permutation-equivariant, reodering of tokens simply permutes our ouputs. Ideally, we would like our model to be sensitive to permutation[^perm]. Thus we introduce a positional encoding that breaks this symmetry. To do so, we use sinusoidal positional encodings. For each pair of coordinates $2k, 2k+1$ in the $i$th embedding vector, we define

[^perm]: Language is *not* permutation equivariant. For example, the sentences "every student solved one problem" and "one student solved every problem" mean very different things.

$$
p_{i, 2k} = \sin\left(\frac{i}{10000^{2k/d}}\right), \quad p_{i, 2k+1} = \cos\left(\frac{i}{10000^{2k/d}}\right).
$$

This choices of encodings is justified for two reasons.

Firstly, lower dimensional coordinates are encoded as high frequency sinusoids whilst higher dimensional ones are encoded as lower frequencies. This has the advantage that the former components can detect small positional differences precisely whilst the latter can encode coarse positional information over our entire sequence.

Secondly, the inner product between two encodings, $\langle p_i, p_j \rangle$ is a function of $\lvert i - j\rvert$[^innerprod]. The consequence of this is that dot products between queries and keys contain information about relative distance. 

Thus, the transformer gains, via this encoding, information both about absolute and relative positions.

[^innerprod]: This is a rather tedious exercise in high-school trigonometry. 


## The Transformer Layer

A single transformer layer consists of two sublayers

1. Multi-Head Self-Attention
2. Positionwise Feed-Forward Network


wrapped in a residual addition, followed by layer normalisation. 

$$
\operatorname{LayerOutput} = \operatorname{LayerNorm}(X + \operatorname{Sublayer}(X)).
$$

We now expand on this structure in detail.

### Residual Connections

We suppose that a sublayer coputes a function $F: \mathbb{R}^{n \times d} \to \mathbb{R}^{n \times d}$. Instead of outputting $F(X)$, the transfomer outputs 
$$
X + F(X).
$$
This is known as a residual connection. This has a number of important consequences. 

Firstly, a transformer layer

$$
f(X) = \operatorname{MHA}(X) \text{ or } f(X) = FFN(X)
$$

is highly non-linear. Stacking $L$ such maps gives a derivative

$$
\partial_X F = \prod_{i = 1}^{L} \partial_X f_i
$$

This can lead to exploding or vanishing gradients during back-propagation. In contrast, once a residual connection is enabled, $f(X)$ is replaced by $X+f(X)$ from which we obtain

$$
\partial_X(X + f(X)) = I + \partial_X f(X).
$$

The presence of the identity term introduces a direct gradient path that does not explode or vanish with depth.

Secondly, if a deep network needs to learn behaviour similar to the identity map, a non-residual architecture must learn parameters that effectively cancel each other out to produce the output $X$. In contrast, a residual contrast needs only to make the learned transformation $f(X)$ small This is far more tractable and stabilises our transformer architecture.

### Layer Normalisation

After applying the residual connection, the transformer applies LayerNorm to each token vector, $h$, individually

$$
\operatorname{LN}(h) = \frac{h - \mu(h)}{\sigma(h)} \\; \odot \\; \gamma + \beta,
$$

where
- $\mu(h)$ is the mean of the components of $h$,
- $\sigma(h)$ is the standard deviation of the components of $h$,
- $\gamma, \beta$ are learned parameters, 
- and $\odot$ denotes elementwise (Hadamard) multiplication.

Layer norm normalises each token vector. This is very important since transformers have very large per-token activations. This is primarily as attention produces large dot products and FFN layers can apply very large linear projections. Without normalisation, these values can accumulate leading to unstable training.

### Pointwise Feed-Forward Network

Once we pass through the attention sublayer, each token is processed independently by a two-layer MLP:

$$
\operatorname{FFN}(h_i) = W_2 \sigma(W_1h_i + b_i) + b_2,
$$
where

- $W_1 \in \mathbb{R}^{d_{\mathrm{ff} \times d}}$,
- $W_2 \in \mathbb{R}^{d \times d_{\mathrm{ff}}}$,
- $\sigma$ is an activation function, given by $\operatorname{ReLU}$ in the original paper.
- $d_{\mathrm{ff}}$ is the dimension of our feed forward layer.


We recall that in attention, token $i$ gathers information from tokens in other positions $j$ and mixes to produce an output. The FFN layer acts as a non-linear manipulation on each individual vector, which gives us local feature transformations across the coordinates of the vector $h_i$.
