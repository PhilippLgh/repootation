# Re💩tation (Repootation)

>"A concept which can arguably be considered to be a mirror image of currency is a reputation system."
https://github.com/ethereum/wiki/wiki/Problems#12-reputation-systems

Re💩tation (repootation) is a react component ❤️👍👎💩 for fast and efficient rating, that can be embedded anywhere on the Internet and allows to capture reactions and ratings to content in a decentralized and verifiable 🔑 way.
Re💩tation uses triples of the form `<content hash><relationship><signature>` that are stored on orbitdb 🛰️ through 3Box.
With these statements we can construct an entity relationship graph 🌳 and verify all edges between nodes.

![repootation demo gif](assets/repootation.gif)

## Why?
Facebook "like buttons"  👍 can be found everywhere on the Internet.
Without StackOverflow upvotes ⬆️ it could be possible that a lot of software (maybe even Ethereum) would not (yet) exist.
GitHub stars ⭐ are one of the most important factors to assess the quality and popularity of a software.

While these reputation concepts are extremely powerful and make it very easy to capture reactions and a rating of content they also have major restrictions:
- they only represent one domain specific attribute - no simple format to express them
- they are centrally managed and stored on company servers (reputation can go "out of business", be target of DoS attacks)
- they are hard to process by other software such as package managers (only download audited modules, display modules with >100 likes)

Ideally
- we would own our opinion and it would be censorship resistant
- we could express and store relationships of identities to content in a decentralized way
- we would have a format that can be used as metadata and be easily processed by a program.
- this information would be agnostic of underlying hosting infrastructure and portable / transferrable.

# 💯

## Challenges 💩💩💩💩
Some of the problems Repootation were facing belong arguably to the hardest cs problems.
And of Repootation does not solve all of them. 💩

Goals:
- Multiple votes by one account are not allowed ✅</li>
- One identity = one account (anti sybil attacks) ❌ - not (yet) 
  -options:
  - central server that validates identity 🕵️
  - chain of trust ⛓️
  - proof of work 🔨
  - stake 💰
- Non repudiation: bad actors cannot revert or obscure their actions ✅
- Decentralized storage ✅
- Portable and expressive data format ✅
- Verifiable relationship statements ✅

## Solutions ❤️️️️❤️️️️❤️️️️❤️️️️

Data format:
`<content hash><relationship><signature>`

Scoring:
❤️: +2
👍: +1
👎: -1
💩: -2

Decentralized storage with 3Box and orbitdb 🛰️

Experiments ❤️ & 💩:
Poo emoji 💩 is an important element to simulate trolls or bad actors.
Let's consider a game where good actors will try to increase utility of the system but bad actors will constantly vote with poo.
How can we mitigate bad behavior or incentivize good one?

## Use Cases
- Smart contract indicators and badges in remix
- censorship resistant support buttons
- 0 tracing
