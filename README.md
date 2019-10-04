# Shrink-Url

This Repo contains a source code for Tinyfor.me [Click Here to Visit](https://www.tinyfor.me/)

Tinyfor.me aims at reducing the Url's size and make them smaller and easily readable.

**Features Currently Supported**
- Easy Sign in With Google.
- Unlimited Custom URLs.
- No need to Login to tiny the URL (But to make a custom url, sign-in is must.).
- Count of total vists on the Tiny-URL.
- You can edit the Long and as well as small URL afterwards.
- History of All tiny-URLs.
- On/Off feature to Restrict the Access.


## How to run the project on your machine

**Before Moving to Clone Part**

- You should have your google-sign in kit. [More info](https://developers.google.com/identity/sign-in/web)
- You should have MongoDB (Free Mongo DB)[https://www.mongodb.com/]


You must have [node and npm](https://nodejs.org/en/) installed on your machine.

To install it on your machine do the following commands:

```bash
  git clone https://github.com/tanwanimohit/Shrink-Url
  cd Shrink-Url
  npm install
  npm start
```

**Before Runnning**

Replace some these lines.

- Replace Your Mongo DB URL on `38 Line in index.js`
- Replace Your Mongo DB Name on `44 Line in index.js`
- Replace Client id of your Google Signin on `80 Line in index.js` and `15 Line in views\home.ejs`

## How can you Contribute?

- If you see any Security Flaws / Error Bugs than go ahead and make a PR.
- If you have new idea about the Product go ahead raise a new issue.
- Improve the currently supported features.
