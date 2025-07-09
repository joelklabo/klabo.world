---
title: "Hashing - The Key to Understanding Bitcoin Mining"
summary: "An in-depth exploration of Bitcoin mining, explaining how hashing works, why it's crucial for network security, and the process of finding valid blocks."
date: 2022-05-20
publishDate: 2022-05-20
tags: [bitcoin, hashing, mining]
---

When someone first begins their journey of trying to understand Bitcoin mining and how it works they will quickly come across the concept of hashing. When I try to explain it to someone else this is the part that presents the biggest challenge. Unless you happen to be a programmer (even many programmers don't know what it is) you probably have no idea what it means or why it's needed. I believe understanding hashing is the key to really understanding Bitcoin mining and how it works. Here I will try to explain what it is. Why it's useful. And why it's important to Bitcoin.

**Hashing**

When I started learning about Bitcoin I was already working as a programmer. For me hashing was an unknown concept, even though I was unwittingly using it all the time. It is one of those things that doesn't really have an analogy to real life as far as I know. Although it is named after a hash, as in hashed browns. You can [salt](https://en.wikipedia.org/wiki/Salt_(cryptography)) your hash too. 

Now that you have a reason to learn what hashing is, you will likely see it all over the place.

***What is hashing?***

I think the best place to start is with an example. Here is the hash of `"a"` and the hash of `"b"`:

```
MD5 ("a") = 0cc175b9c0f1b6a831c399e269772661
MD5 ("b") = 92eb5ffee6ae2fec3ad71c777531578f
```

Here I am using the MD5 hashing algorithm, my computer has a program of the same name that can create a hash for me. The hash is that long string of letters and numbers there. The [MD5](https://en.wikipedia.org/wiki/MD5) hashing algorithm (which is used by the md5 program on my computer) produces a 128-bit hash value. The string of letters and numbers actually represents a 128-bit number, it's just formatted that way to make it easier for humans to read. The format is called [Base64](https://en.wikipedia.org/wiki/Base64). 

A hash function takes some input, in this case `"a"` or `"b"`, and gives you back a number in some range. In the case of MD5, becaues it's a 128-bit hash function, that range would be 0 to 2^128 - 1, or between 0 and 340,282,366,920,938,463,463,374,607,431,768,211,455.

Any data can be hashed, no matter the size, and you will get some number between 0 and 340,282,366,920,938,463,463,374,607,431,768,211,455 out of it. Could be the letter `"a"`, a video, a song, a document, your entire photo library. Or most importantly to us a Bitcon block.

Here is a good visual representation from the [Hash Function](https://en.wikipedia.org/wiki/Hash_function) article on Wikipedia:

![image](/images/hash-table-example.png)

***Why is hashing useful?***

If I had to download some important file off the internet, once it was locally on my computer I could hash it and get a hash value. Then I could check that hash against a known correct hash (probably listed on their website) and know I had the un-tampered with file I wanted.

If even one bit changed in that file I would get a completely different hash value. Hashing is deterministic, the same input should always have the same output. If it doesn't, something has changed.

I'm no cryptography expert and there are many better resources out there to learn how hashing actually works. Here is a good video about hashing and some of it's uses:

[![image Hashing Algorithms and Security - Computerphile](https://img.youtube.com/vi/b4b8ktEV4Bg/0.jpg)](https://www.youtube.com/watch?v=b4b8ktEV4Bg)

The main concept to remember is that when you hash some data it will always give you the same value. And that value is not predictable. It will be somewhere within it's range of possible values. If you want to get a specific hash value for some reason (mining bitcoin, maybe?) you will just need to keep trying different inputs until you get the output you want. There is no shortcut.

**Why is this important for Bitcoin?**

Bitcoin uses hashing all over the place. For Bitcoin addresses. Transaction IDs. But the most interesting and important use, in my opinion, is mining.

We have all heard that Bitcoin is a Blockchain. If you take a look at one of the blocks in bitcoin you will see multiple uses of hashing. Here is what a bitcoin block looks like (this is the second block ever mined):

```
~$ bitcoin-cli getblock 00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048
{
  "hash": "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048",
  "confirmations": 737180,
  "height": 1,
  "version": 1,
  "versionHex": "00000001",
  "merkleroot": "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
  "time": 1231469665,
  "mediantime": 1231469665,
  "nonce": 2573394689,
  "bits": "1d00ffff",
  "difficulty": 1,
  "chainwork": "0000000000000000000000000000000000000000000000000000000200020002",
  "nTx": 1,
  "previousblockhash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
  "nextblockhash": "000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd",
  "strippedsize": 215,
  "size": 215,
  "weight": 860,
  "tx": [
    "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098"
  ]
}
```

There are a lot of hashes here:

- `hash` the hash of this block
- `previousblockhash` the hash of the previous block
- `nextblockhash` the hash of the next block
- `tx` there is one transaction in this block and this is it's hash. In a more recent block there would be thousands of hashes here for each transaction that was confirmed in the block.
- `merkleroot` is a hash of all the transaction hashes, hashed together! You can learn more about [Merkle Trees](https://en.wikipedia.org/wiki/Merkle_tree) on Wikipedia. Since there is just one the hash is equal to the `tx` hash.

You will notice that `previousblockhash` and `nextblockhash` are what makes this block part of a chain, a *blockchain*. Each new block that is mined points to the previous one. Because there have been blocks mined after this as well it also points to the next one.

> The `nextblockhash` is not part of the block information that is mined. Unless you can predict the future there's no way to know what that value would be. It just shows up here for convenience.

There is another interesting thing to note here, the `nonce` or number-used-only-once. This will be important to understanding mining.

> If you'd like a visual of real-time bitcoin blocks [Mempool.space](Mempool.space) is a really useful website to see blocks and how they are connected. You can see how many transaction are coming in and which ones will likely be in the next block.

**Bitcoin mining**

You will notice all the block hashes (known as [block headers](https://developer.bitcoin.org/reference/block_chain.html#block-headers)) have a lot of zeroes at the beginning of them. Most hashes we've seen so far don't have that.

In the beginning of the article we mentioned that the hashes we're seeing here are base64 encoded in order to be shorter and easier to read. But they really just represent a number. In the case of Bitcoin the hashing algorithm used is [sha256](https://en.wikipedia.org/wiki/SHA-2) a 256-bit hash algorithm.

If a hash has a lot of zeroes at the beginning of it that just means it's a low number.

***What are miners actually doing?***

It is the miners' job to add blocks to the blockchain. They pick which transactions they want to include (usually just the ones with the highest transaction fees). Blocks have a maximum size so they can't just include all the transactions. They build up a candidate block with all this information, including the `previousblockhash` which links it to the previous blocks. Then they start the process of mining (hashing).

 So to go back a little bit, all the miners create some data that they want to be the next bitcoin block. And they are hashing it. But why? How do they "win"? That's where the `difficulty` in the block above comes in.

What they are doing is trying to find a hash with a value lower than that difficulty. The first one to do that wins. The `difficulty` value in the block I showed above is a little misleading because it was only the second block ever. It has gotten a lot more difficult since then. As of writing this the value is 31251101365711.12 (bigger is more difficult). 

Explaining how the difficulty is calculated is a little complicated, you can learn about it [here](https://en.bitcoin.it/wiki/Difficulty) if you want to know more. For our purposes though it's enough to know that the higher the difficulty is the lower the number is that the winning hash value must be lower than. Said another way, the higher the difficulty is the less likely it is to find a hash that is below the threshold.

So what are Bitcoin miners actually doing? They're hashing, over and over again. When a miner wants to mine the next block they will build a candidate block (candidate meaning not yet part of the blockchain). The block contains the `previousblockhash` the new transactions they want to include in the block. And a bunch of other information as well. And then they start hashing it. Until they find a hash with a sufficiently low number.

But, if every miner is hashing the same data wouldn't they all get the same value over and over? Same input same ouput, right? Yes, they would. That's where the `nonce` or number-used-only-once I mentioned earlier comes in. The miners can put whatever they want in there to change the block's data a little bit and thus get a different hash value.

So all those miners out there are just taking their block they want to mine, hashing it, checking if the hash value is low enough. If it is not, they update the nonce, and repeat until someone finds one that works. If they do they are rewarded with the mining reward (currently 6.25 bitcoin) and everyone moves on to trying to find the next block, setting the `previousblockhash` to the one that was just found.

And that's basically it. When you hear miners are solving "complex math problems" you now know that's not really accurate. It's much more similar to flipping 256 coins and hoping you get the first 100 all heads. And as bitcoin mining gets more difficult you will need to get 200 heads and so on. The way the difficulty changes in bitcoin is a topic big enough for it's own article so I won't explain it here. But, to put it simply if "winning" hashes are being found too fast (10 minutes is the target) the difficulty will be increased. If they are not being found fast enough, the difficulty will decrease.

**Conclusion**

Bitcoin mining is surprisingly simple. Basically rolling lots of dice on a massive scale. And it's all based on hashing. I hope this was helpful to some of you out there. If you find any inaccuracies or want some other resources contact me here: [@joelklabo](https://twitter.com/joelklabo). Thanks for reading!
