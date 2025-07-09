---
title: "Custom Data in Lightning Payments"
summary: "Exploring LND v0.9's Custom Onion-Tunneled TLV Payment Metadata Records feature, which enables keysend payments and messaging apps like Sphinx Chat by attaching custom data to Lightning payments."
date: 2021-03-21
publishDate: 2021-03-21
tags: [lightning, bitcoin]
---

## Custom Onion-Tunneled TLV Payment Metadata Records

With the release of v0.9 ([see release notes](https://github.com/lightningnetwork/lnd/releases/tag/v0.9.0-beta)) LND added the ability to attach custom data to a payment. This enables features like [keysend](https://lightning.readthedocs.io/lightning-keysend.7.html) which allows you to send funds to a node without an invoice, as well as messaging over lightning with apps like [Sphinx Chat](https://sphinx.chat). We'll go into more detail on how those work in the next section. 

When making a lightning payment you are now able to add your own custom data to a field called `dest_custom_records`. The format of these *custom records* is the [Type-length-value](https://en.wikipedia.org/wiki/Type-length-value) or TLV encoding scheme. Hence the name of the feature *Custom Onion-Tunneled TLV Payment Metadata Records*.

The definition of the `dest_custom_records` parameter is as follows ([from the `lncli sendpayment` api docs](https://api.lightning.community/#sendpayment))

```
An optional field that can be used to pass an arbitrary set of TLV records to a peer which understands the new records. This can be used to pass application specific data during the payment attempt. Record types are required to be in the custom range >= 65536. When using REST, the values must be encoded as base64.
```

Using this new feature you could send any arbitrary data along with your payment, as long as the onion packet is still within the required size limits.

## Use Cases

### `keysend`

I mentioned earlier that these records are already being used in production apps, you may have used them yourself. The most common use I'm guessing is for `keysend` payments.

`keysend` payments allow you to make a payment to another node without an invoice. From the [LND v0.9 Release Notes](https://github.com/lightningnetwork/lnd/releases/tag/v0.9.0-beta):

```
One application of custom records is a spontaneous payment, also known as keysend. In key send, a custom record is used to encode the payment preimage in the onion payload for the recipient of the payment. This allows them to pull the payment without prior knowledge of the preimage.

Note that spontaneous payment is not yet defined in the Lightning spec. Therefore the current implementation should be considered experimental and is subjected to change.
```

In a regular invoice lightning payment there is a `payment_preimage` that would normally be coming from the receiver, but in a keysend payment the sender provides the pre-image in the `custom_records` payload. So with a keysend payment the receiver doesn't have to do anything to be able to receive payments.

Here an example keysend payment from the release notes:

```
🏔 tlncli sendpayment --keysend --dest=0270685ca81a8e4d4d01beec5781f4cc924684072ae52c507f8ebe9daf0caaab7b --amt=1000 --final_cltv_delta=40
{
    "payment_error": "",
    "payment_preimage": "5c8fb9c043d00e4c1780b2e0992a979284b941700219726c71e6093c387679de",
    "payment_route": {
        "total_time_lock": 1657728,
        "total_fees": "0",
        "total_amt": "1000",
        "hops": [
            {
                "chan_id": "1589156041461923840",
                "chan_capacity": "16777215",
                "amt_to_forward": "1000",
                "fee": "0",
                "expiry": 1657728,
                "amt_to_forward_msat": "1000000",
                "fee_msat": "0",
                "pub_key": "0270685ca81a8e4d4d01beec5781f4cc924684072ae52c507f8ebe9daf0caaab7b",
                "tlv_payload": true,
                "mpp_record": null,
                "custom_records": {
                    "5482373484": "5c8fb9c043d00e4c1780b2e0992a979284b941700219726c71e6093c387679de"
                }
            }
        ],
        "total_fees_msat": "0",
        "total_amt_msat": "1000000"
    },
    "payment_hash": "8cf790cc128a0bb0552b3223d542adfba6a93c948f84e49dcd532309f5b85634"
}
```

`keysend` is named what it is because you send the pre-image (just a guess). It wouldn't be possible to make payments this way without cutsom records.

Another use case that I'm aware of is sending peer-to-peer messages over the lightning along with a payment.

## Spinx Chat

This same feature can be used to send any data so it was only a matter of time until someone built messaging on top of it. Spinx chat uses this feature to send message information, along with the payment pre-image, in a lightning payment.

If your node receives a payment with this custom information in it it will be stored as part of the invoice and can be interpreted as a message or whatever else you would like.

In the [sphinx-relay repo](https://github.com/stakwork/sphinx-relay), which is used on top of LND to parse out and send these messages, you can see where they are adding a custom record for the message information: [source](https://github.com/stakwork/sphinx-relay/blob/master/src/utils/lightning.ts#L240-L243)

```
const keysend = (opts) => {
  return new Promise(async function (resolve, reject) {
    let lightning = await loadLightning()
    const randoStr = crypto.randomBytes(32).toString('hex');
    const preimage = ByteBuffer.fromHex(randoStr)
    const options = {
      amt: Math.max(opts.amt, constants.min_sat_amount || 3),
      final_cltv_delta: 10,
      dest: ByteBuffer.fromHex(opts.dest),
      dest_custom_records: {
        [`${LND_KEYSEND_KEY}`]: preimage,
        [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data),
      },
      payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
      dest_features: [9],
      fee_limit: { fixed: 10 }
    }
    const call = lightning.sendPayment()
    call.on('data', function (payment) {
      if (payment.payment_error) {
        reject(payment.payment_error)
      } else {
        resolve(payment)
      }
    })
    call.on('error', function (err) {
      reject(err)
    })
    call.write(options)
  })
}
```

## Conclusion

Lightning apps now have the ability to carry along custom information with them. If the node receiving your custom information knows how to interpret it you can add a new layer of communication or metadata to your payments.

There are only a few examples I know of this being used, the ones I mentioned above. But there are a lot of possibilities here and I think it's going to be a ripe area to explore in the future.