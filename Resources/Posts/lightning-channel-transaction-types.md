---
title: "Transaction Types in a Lightning Channel"
summary: "Comprehensive guide to the different transaction types in Lightning Network channels, including funding, commitment, and closing transactions."
date: 2021-03-14
publishDate: 2021-03-14
tags: [lightning, bitcoin]
---
Every payment made over the Lightning network is made with valid Bitcoin transactions. The Lightning network’s main benefit is that it allows you to use real Bitcoin transactions, along with their security guarantees, without having to pay to have every one included into a block.

When you open a channel with someone what you are really doing is setting up a communication channel where you can send Bitcoin transactions back and forth to each other, without submitting to the Bitcoin blockchain.

The innovation of the Lightning network was that it figured out a safe way to transact off-chain, thus reducing the amount of fees required. The “network” part of the Lightning network could technically be replaced with anything that allows you swap Bitcoin transaction data back and forth with someone else.

So, what type of transactions make this possible? Assuming we don’t want to get our bitcoin stolen or stuck in an un-spendable output. That’s what we will try and explain in the following sections. For a more thorough explanation you should check out [Mastering the Lightning Network](https://github.com/lnbook/lnbook). Or even more thorough, the [Lightning Network Spec](https://github.com/lightningnetwork/lightning-rfc).

## Opening a Channel
When you want to transact with some other node on the Lightning Network you open a channel with them. This will allow you to coordinate to create and sign Bitcoin transactions. Most of these will not be submitted to the blockchain, otherwise why use Lightning? But, any of them could be. They are all valid and would be accepted by the Bitcoin network.

We’ll use our good friends *Alice* and *Bob* to represent the two nodes that want to make payments over a Lightning channel. In this example *Alice* wants to open a channel with *Bob* with a capacity of 1 BTC. The capacity is the total amount that will be available to use in this channel, it will all start of in *Alice’s* control, and then if she wants to make a payment to *Bob*, she will send him some BTC from that 1 BTC balance.

### The Funding Transaction

*Alice* starts off with 1 BTC in her personal Lightning node wallet. This is the same as a Bitcoin wallet but usually Lightning nodes have their own. Right now the 1 BTC is fully in her control, she has the private key stored on her machine and is able to spend this 1 BTC. 

When *Alice* decides to open a channel with *Bob* she needs to move that 1 BTC to an output that both her and *Bob* are able to access, if they agree to make a payment. So, *Alice* will create a Funding Transaction.

The funding transaction is a 2-of-2 multi-sig output where she is one of the required signers and *Bob* is the other. *Alice* creates this transaction and sends it to *Bob* to sign. He has no reason not to agree to sign this because *Alice* is adding all of the funds, he has nothing to lose.

So *Alice* will create a 2-of-2 multi-sig transaction, send it to Bob to sign and then hold on to it. She doesn’t want to submit this to the network yet, if she did at this point she would lose control of her 1 BTC if *Bob* didn’t want to sign a new transaction spending that multi-sig output.

### Commitment Transactions

So at this point *Alice* has a signed multi-sig transaction in her possession but not submitted to the network. Next she will create a Commitment Transaction. A commitment transaction is the type of transaction we will be creating for every payment that is made between *Alice* and *Bob*. This transaction spends from the funding transaction and sends the balance to *Alice* and *Bob*, the amounts depending on payments that have occurred. This first commitment transaction will be spending the 1 BTC output from the funding transaction and sending the 1 BTC back to *Alice* and zero BTC to *Bob*. 

Alice creates this transaction locally and sends it to *Bob* to sign. Once again he has no reason not to sign it so he does and sends it back to *Alice*. Now that *Alice* has this commitment transaction she can now submit the funding transaction to the Bitcoin network. This is safe for her to do because if she needs to close that channel for some reason she has the commitment transaction that she can send off that will spend the multi-sig and send her 1 BTC back to her wallet.

From this point forward *Alice* can make a payment to *Bob* by creating a new commitment transaction with the updated amounts. For example if *Alice* sent 0.1 BTC to *Bob* the new commitment transaction would credit 0.9 BTC to her wallet and 0.1 BTC to *Bob’s* wallet.

Every time a payment is made a new commitment transaction is created, both peers have a copy (actually they are slightly different which we’ll go over in the next section) signed by the other. At any point one of them could submit a commitment transaction to the network and close the channel by spending the funding transaction’s output.

### The Two Sides of a Commitment Transaction

Although any of these commitment transactions could be sent to the network to close the channel, they are all valid, the network doesn’t have a way of knowing if this is actually the most recent commitment transaction. *Alice* could always send the very first commitment transaction where all the funds get sent back to her, even after making payments to *Bob*. We will see how logic in the transaction prevents this.

There are two ways these transactions prevent cheating by submitting an out-dated transaction to the network. Time-locks and a Revocation Key.

### Time-Locks

This is where *Alice* and *Bob’s* commitment transactions differ slightly. Each new commitment transaction that *Alice* creates and has signed by *Bob* has a time-lock on her output but not on *Bob’s* output. And *Bob’s* commitment transaction has a time-lock on his output, but not on *Alice’s*. A time-lock prevents an output from being spent for a certain number of blocks (or until a specific time).

If *Alice* has gone offline and isn’t around to close the channel cooperatively *Bob* may need to use his most recent commitment transaction to close the channel. In that case the time-lock just serves as an incentive to get both peers to close cooperatively, *Bob* would rather not wait 1000 blocks to be able to receive his bitcoin. The fee is also determined at the time the commitment transaction was created and will probably be much higher than would be necessary normally. So *Bob* and *Alice* would both prefer to decide to close the channel together, make a new commitment transaction with no time-lock for either, and a reasonable fee. But, if *Bob* has to close his channel he can, he’ll just have to wait to access his coins.

The time-lock also serves a more important purpose though. It allows the other peer to use their revocation key if their partner tries to cheat and submit an out-dated commitment transaction to the network.

### Revocation Key

The revocation key is one more place where *Alice* and *Bob’s* commitment transactions differ. If either of them has this secret key they have the ability to claim the other’s balance in the channel. They would have the entire channel capacity sent to them.

On each update to the commitment transaction, they exchange half of the revocation key for the previous transaction. So whenever there is a new commitment transaction, the previous one is invalidated. The revocation key is only useable on an out-dated commitment transaction that has been confirmed on the blockchain.

This is why the time-lock is necessary, if *Bob* tries to cheat and use an out of date commitment transaction, when it is confirmed on the blockchain *Alice* then has the 1000 blocks (this is a configurable time) to use the revocation key and take *Bob’s* balance in the channel. *Bob* is not able to move those bitcoin until the 1000 blocks has passed, so as long as *Alice* notices she can take the funds back.

If your lightning node is online when this occurs you should be notified of it. There is also something called a Watchtower which is a service that can observe the blockchain for you and watch out for this.

### Closing Transaction

Ideally both *Alice* and *Bob* cooperate the whole time. They agree on a time to close their channel and create one final commitment transaction. This final transaction doesn’t need any time-locks or revocation keys because they have both agreed to split the balance of the channel in a specific way. Also, like I mentioned before this allows the transaction fee to be set to a reasonable value. (The creator of the channel always pays the transaction fees out of their balance)

And that’s it. At any point during the life-cycle of the channel either participant has the ability to bail out and get their funds back, eventually. 

### Conclusion

So in a lightning channel there are really two types of transactions. The funding transaction, and commitment transactions. The commitment transactions vary slightly depending on who owns them. Depending on how long the channel is open and how often you make payments, you will have one funding transaction, potentially infinite commitment transactions, and a closing transaction (which is basically just the last commitment transaction).

I hope that is helpful in understanding lightning channels and the bitcoin transactions they are built on. Like I mentioned earlier [Mastering the Lightning Network](https://github.com/lnbook/lnbook) is a good resource to learn more. As well as the [Lightning Network Spec](https://github.com/lightningnetwork/lightning-rfc).
