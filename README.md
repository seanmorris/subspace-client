![avatar](https://avatars3.githubusercontent.com/u/640101?s=80&v=4)

# Subspace Client

Browser-side code for Subspace sockets.

## Installing

### npm

the recommended way to get subspace-client is via npm:

```bash
$ npm i subspace-client
```
### cdn

subspace-client is also available from unpkg:

minified: https://unpkg.com/subspace-client@0.0.7/dist/subspace-client.min.js

```html
<script src = "https://unpkg.com/subspace-client@0.0.7/dist/subspace-client.min.js"></script>
```

uncompressed: https://unpkg.com/subspace-client@0.0.7/dist/subspace-client.js

```html
<script src = "https://unpkg.com/subspace-client@0.0.7/dist/subspace-client.js"></script>
```

### Usage

#### Connecting

Open a connection to a host (or get a reference to an existing connection) with `Socket.get(HOST)`. By default only one connection to each host will be made.

```javascript
const host   = 'ws://your-socket-host';  // use wss: for SSL

const socket = Socket.get(host);
```

Force a new connection by passing the `refresh` boolean as the second parameter:

```javascript
const host      = 'ws://your-socket-host';  // use wss: for SSL
const socket    = Socket.get(host);

const otherSock = Socket.get(host, true);
```

#### Receiving

Listen for messages & other events on a socket/channel with `socket.subscribe()`

```javascript
const host   = 'ws://your-socket-host'; // use wss: for SSL
const socket = Socket.get(host);

socket.subscribe('open',  () => console.log('socket ready!'));
socket.subscribe('close', () => console.log('socket closed!'));
```

You can subscribe to messages matching only a given set of channels by prepending 'message:' to the a channel name selector, and using that string as the first parameter. See *Using Channels* below.

```javascript
const host   = 'ws://your-socket-host'; // use wss: for SSL
const socket = Socket.get(host);

const channels  = 'chat:cats:*';
const eventName = `message:${channels}`;

socket.subscribe(eventName, (event, message, channel, origin, originId, originalChannel) => {
	event           // original event
	message         // payload
	channel         // channel message was received on
	origin          // message origin (user or server)
	originId        // uid of sender
	originalChannel // channel message was published on

	console.log('message received!', message);
});
```

#### Sending

##### Broadcasting to all users on a channel

Publish messages to a channel with `socket.publish(channel, message)`

```javascript
const host    = 'ws://your-socket-host';  // use wss: for SSL
const socket  = Socket.get(host);

const channel = 0x0;
const message = 'This is the payload.';

socket.publish(channel, message);
```

##### Sending private messages

Send messages to certain users on a channel with `socket.say(channel, users, message)`

```javascript
const host    = 'ws://your-socket-host';  // use wss: for SSL
const socket  = Socket.get(host);
const message = 'This is the secret payload.';

const channel = 0x0;
const users   = [0x12, 0x15, 0x42];

socket.publish(say, users, message);
```

You can also use an object with the keys `cc` and `bcc` to secretly send messages to certain users. Both `cc`and `bcc` are optional but **at least one** is required when using this notation.

Users in the cc list will be sent with the message in the header. Users in the bcc list will remain private.

```javascript
const host    = 'ws://your-socket-host';  // use wss: for SSL
const socket  = Socket.get(host);
const message = 'This is the secret payload.';

const channel = 0x0;
const cc      = [0x12, 0x15, 0x42];
const bcc     = [0x13, 0x16, 0x43];

socket.publish(say, {cc, bcc}, message);
```

#### Unsubscribing

Muliple part of your application can subscribe to the same channel on the same socket.

You can clean these subscriptions up with `socket.unsubscribe(channel)`. This way the server will know to stop sending messages we're no longer interested in.

The library will maintain a count of subscriptions by **explicit** channel name selectors. Subspace will only unsubscribe at the server once this count reaches zero.


```javascript
socket.unsubscribe('message:chat:cats:main');
```

### Using Channels

Subspace divides its channels into two types: binary & text. Binary channels are numbered with integers, and text channels have textual names.

This is all handled by the library, but it is sometimes important to note that binary channels have **much** less overhead.

#### Text Channels

Text channels may be addressed with explicit names, or with channel name selectors. Channel name selectors may be used with publish, subscribe and unsubscribe.

Channel name selectors may contain wildcards, and ranges, like the following:

**please note all integers below are hexadecimal.**

##### Channels:

```
chat:cats:main
chat:cats:announce

chat:dogs:main
chat:dogs:announce
```

##### Selectors:

```
chat:*:main        - will match chat:cats:main & chat:dogs:main
chat:cats:*        - will match chat:cats:main & chat:cats:announce

chat:*             - will match all channels starting with chat:
```

##### Channels:

```
game:0:turns
game:0:chat
...
game:1000:turns
game:1000:chat
```

##### Selectors:

```
game:0-500:turns   - will match all game:*:turns where segment 2 is 0-500
game:500-1000:chat - will match all game:*:chat where segment 2 is 500-1000

game:#:turns       - will match all game:*:turns where segment 2 is an integer
game:#:*           - will match all game:*:* where segment 2 is an integer

```
