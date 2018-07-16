## Bitpay Sign and Verify
The server has a few basic routes, and a very basic express app. 

To get the server going, please run:
```
npm i
npm start
```

For the Client, I have made it a bit of an interactive cli. To get the Client started run:
```
node CLIENT/client.js
```

Follow the onscreen instructions to set a password, authenticate and save a public key, and to sign a message to see if it verifies.

You may generate your keys however you wish.

#### Dependencies
The only dependencies used outside of native node modules are Bcrypt and Mongoose. Mongoose for ease of use with mongodb, 
and bcrypt to better protect the hashed passwords.