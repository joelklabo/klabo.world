---
title: "How Does Sphinx Chat Work?"
summary: "Technical breakdown of how Sphinx Chat leverages Lightning Network's custom TLV records to enable encrypted peer-to-peer messaging with micropayments."
date: 2021-03-08
publishDate: 2021-03-08
tags: [sphinx, lightning, bitcoin]
---
Like a lot of Bitcoin / Lightning Network enthusiasts out there I have just started using Sphinx Chat. I wasn’t able to find a good overview of the system anywhere so I decided I would write one. I’m not an expert on any of this stuff but I did some poking around in the [sphinx-relay](https://github.com/stakwork/sphinx-relay) GitHub repo and I think I understand the basic setup.

If you are using Sphinx you probably know that it is built on top of the Lightning Network. [LND](https://github.com/lightningnetwork/lnd) specifically (although other lightning network projects might be supported in the future). In case you don’t know, LND is built on top of Bitcoin. It is a piece of software that interacts with the Bitcoin blockchain to create multi-sig transactions that can open lightning channels, as well as create [HTLC contracts](https://en.bitcoin.it/wiki/Hash_Time_Locked_Contracts) for sending payments on the Lightning Network.

So at a high level you have bitcoind (or btcd) as the base layer. LND is built on top of that. And sphinx-relay is built on top of LND.

sphinx-relay itself is a node.js app built with [express](https://github.com/expressjs/express). It acts as a server, it relays messages, boosts, etc. from your client (iOS, desktop, Android) and translates them into Lightning Network payments.

![image](/images/sphinx-relay-diagram.png)

## How Does Sphinx Relay Turn Transactions into Messages?

When you send a message to another person on the Sphinx iOS app for example, you are actually sending them a lightning payment. It depends on the context but it is commonly a 1 satoshi payment. Your iOS app sends a request to the sphinx-relay server, which uses LND to send a Lightning payment. So where is the data for the message coming from?

sphinx-relay takes advantage of an LND feature that allows you to add custom data to a Lightning payment. There is a parameter you can pass along with a payment called `dest_custom_records`, this allows you to send arbitrary data along with your payment. Sphinx uses this field to add data about the message or action you are taking on the client. So if your sphinx-relay instance receives a payment with this information it can parse it out and save it as a new message (or any other model that it understands).

You can see in the code below that `LND.keysendMessage` is being passed a data object. This would be where the message content and recipient etc. go.

![image](/images/keysend-data-code-snippet.png)

## What is a `keysend` Payment versus a Regular Payment?

You may have noticed that these payments are sent as `keysend` payments instead of using invoices like you may be used to with Lightning. You can get the full description [here](https://lightning.readthedocs.io/lightning-keysend.7.html). The gist of it is that keysend is a relatively new feature of LND and coming in c-lightning, that allows you to just send satoshis without an invoice. This is obviously useful when you are sending sats with every message posted.

![image](/images/lnd-keysend-doc.png)

## Conclusion

So to wrap up sphinx-relay is a node app running on top of LND, which runs on top of bitcoind (or btcd). Your client (iOS app, Android app, desktop) interacts with the sphinx-relay server running alongside your LND instance to send and receive message payments. Sphinx adds data to Lightning payments that it can interpret as messages or group joins, etc.

There is a lot more going on than I’ve laid out here but I hope this gives you a good mental model of how it all works together. I may have gotten something wrong here as well, if I did let me know! On Twitter [@joelklabo](https://twitter.com/joelklabo) or email me [joelklabo@gmail.com](mailto:joelklabo@gmail.com)
