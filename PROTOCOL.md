# Cerberes protocol

Cerberes uses [MLS (RFC 9420)](https://www.rfc-editor.org/rfc/rfc9420) for end-to-end encryption, with
several devices per user. This server is the MLS **delivery service**: it relays opaque MLS messages, orders
commits and stores public keys. It never sees plaintext nor any private key, and clients never trust it to
authenticate anyone.

The client side lives in the front-end repository (`src/crypto/`, `src/stores/`), on top of
[ts-mls](https://github.com/LukaJCB/ts-mls).

## Cryptographic choices

| What | Choice |
| --- | --- |
| MLS ciphersuite | `MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519` (mandatory to implement) |
| Recovery phrase | BIP39, English wordlist, 12 words (128 bits) |
| Identity key | Ed25519, secret key = `HKDF-SHA256(ikm = BIP39 seed, salt = "cerberes", info = "cerberes/identity/ed25519/v1", 32)` |
| Local storage | IndexedDB, AES-256-GCM under a non-extractable WebCrypto key, record id as additional data |

## Identity and devices

1. The first device of an account generates a phrase, derives the identity key pair and publishes its public
   key with `PUT /users/me/identity`. It can only be set once.
2. Each device generates its own MLS signature key pair, and the identity key certifies it:

   ```
   certificate = Ed25519-Sign(identity secret key, fields(
     "cerberes/device-certificate/v1", str(User_id), Device_id, signature_public_key))
   ```

   `fields(...)` concatenates each field prefixed with its length as a 4 byte big-endian integer. Strings are
   UTF-8, `Device_id` is a lowercase UUID chosen by the device. This must stay identical in
   `src/entities/devices/devices.helper.ts` (server) and `src/crypto/identity.ts` (client).
3. The device registers itself with `POST /devices`. The server checks the certificate to keep garbage out of the
   directory, but clients verify it on their own.
4. A new device asks for the phrase, checks that it gives back the identity key of the account, and registers
   the same way. The phrase is never stored anywhere.

The MLS credential of a device is a basic credential whose identity is the UTF-8 JSON
`{"v":1,"User_id":…,"Device_id":"…","certificate":"<base64>"}`. The authentication service of the client accepts
a leaf only if this certificate is valid for the leaf's signature key under the identity key it trusts for
`User_id`.

### Trusting identity keys

- The identity of another user is pinned the first time it is seen (from the contact list or
  `GET /users/:id/directory`).
- If the server later returns another key, the client raises an alert and keeps refusing devices certified by
  the new key until the user accepts the change.
- Two users can compare a **safety number**: `SHA-256(fields("cerberes/safety-number/v1", str(id_1), key_1,
  str(id_2), key_2))` with the lowest user id first, shown as 6 groups of 5 digits.

## Delivery service

All MLS routes act for the device given by the `X-Device-Id` header, which must belong to the authenticated
user. Binary values are base64 strings.

| Route | Purpose |
| --- | --- |
| `GET /users/:id/directory` | Identity key and certified devices of a contact or conversation member |
| `POST /key_packages` | Upload key packages of the current device, each with a random `KeyPackage_ref` |
| `GET /key_packages/count` | Key packages left for the current device |
| `POST /key_packages/claim` | Take (and delete) one key package of each given device, to add it to a group |
| `POST /conversations` | Create a conversation; its UUID is the MLS group id, the creator is its only member at epoch 0 |
| `GET /conversations` | Conversations of the current device |
| `POST /conversations/:id/commits` | Submit a commit for an epoch, with the welcome and the added / removed devices |
| `POST /conversations/:id/messages` | Submit an application message for the current epoch |
| `GET /inbox` | Pending messages of the current device, in the order the server accepted them |
| `POST /inbox/ack` | Acknowledge processed messages; a message is deleted once every recipient acknowledged it |

### Ordering

- The server accepts a single commit per epoch: a commit or an application message created for another epoch is
  refused with `409`. The client then processes its inbox and creates it again on the new epoch.
- A client only replaces its group state once the server accepted its commit.
- Commits are delivered to every member device except the committer, including removed ones. Welcomes are
  delivered to added devices with the `KeyPackage_ref` of the key package used for them, so they find the
  matching private keys. Welcomes embed the ratchet tree.
- Any member adds the certified devices of the group's users that are not in the group yet. Concurrent attempts
  are resolved by the epoch check.

## Known limitations

- Web clients trust the JavaScript served to them: a compromised host can serve code that leaks keys.
- The local vault key is non-extractable but stored by the browser: it protects against reading the storage, not
  against code running in the page.
- Devices can't be revoked yet, and a lost phrase can't be recovered: a new identity means new safety numbers.
- New devices don't get the history of the conversations they join.
- `ts-mls` has not had a formal security audit.
