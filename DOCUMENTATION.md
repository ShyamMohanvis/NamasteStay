# NamasteStay — Full Project Documentation

This document describes **every major part** of the NamasteStay codebase: purpose, architecture, setup, environment, routes, data models, middleware, frontend assets, and operational notes.

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Technology stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Repository layout](#4-repository-layout)
5. [Prerequisites](#5-prerequisites)
6. [Installation and local run](#6-installation-and-local-run)
7. [Environment variables](#7-environment-variables)
8. [Application entry (`app.js`)](#8-application-entry-appjs)
9. [HTTP routes](#9-http-routes)
10. [Controllers](#10-controllers)
11. [Data models (Mongoose)](#11-data-models-mongoose)
12. [Validation (`schema.js`)](#12-validation-schemajs)
13. [Middleware](#13-middleware)
14. [Utilities](#14-utilities)
15. [Cloudinary and file uploads](#15-cloudinary-and-file-uploads)
16. [Views (EJS) and static assets](#16-views-ejs-and-static-assets)
17. [Database seeding (`init/`)](#17-database-seeding-init)
18. [Error handling](#18-error-handling)
19. [Session and authentication flow](#19-session-and-authentication-flow)
20. [Deployment notes](#20-deployment-notes)
21. [Known quirks and maintenance notes](#21-known-quirks-and-maintenance-notes)

---

## 1. What this project is

**NamasteStay** is a server-rendered web application for browsing and managing **accommodation listings** (hotels, homes, etc.). Users can:

- Browse all listings
- View a single listing with reviews
- Register, log in, and log out
- **Create** listings (logged in; images go to Cloudinary)
- **Edit** and **delete** only **their own** listings
- **Post** reviews on listings (logged in)
- **Delete** only **their own** reviews

There is no separate SPA: pages are rendered with **EJS** on the server.

**Live demo (as referenced in the project):*

---

## 2. Technology stack

| Layer | Technology |
|--------|------------|
| Runtime | **Node.js** (see `package.json` → `engines.node`: 20.11.1) |
| Web framework | **Express.js** |
| Templates | **EJS** + **express-ejs-layouts** (shared layout) |
| Database | **MongoDB** (via **Mongoose**) |
| Auth | **Passport.js** with **passport-local** + **passport-local-mongoose** |
| Sessions | **express-session** with **connect-mongo** (sessions stored in MongoDB) |
| Flash messages | **connect-flash** |
| Validation | **Joi** (`schema.js`) |
| HTTP verbs in forms | **method-override** (`_method` for PUT/DELETE) |
| Image uploads | **multer** + **multer-storage-cloudinary** → **Cloudinary** |
| UI | **Bootstrap 5** (CDN), custom CSS, Font Awesome, Google Fonts |

The README may mention “MERN”; the **frontend here is EJS**, not React. A common name for this stack is **MEN** (MongoDB, Express, Node) with **EJS** for views.

---

## 3. Architecture

The project follows a **classic MVC-style** layout:

- **Models** (`models/`) — Mongoose schemas and database logic  
- **Views** (`views/`) — EJS templates  
- **Controllers** (`controllers/`) — Request handlers (business logic for routes)  
- **Routes** (`routes/`) — URL mapping, middleware chains, wiring to controllers  

Cross-cutting concerns live in **`middleware.js`**, **`utils/`**, and **`app.js`**.

---

## 4. Repository layout

```
NamasteStay/
├── app.js                 # Express app, DB connect, session, passport, route mounting
├── cloudConfig.js         # Cloudinary + Multer storage
├── middleware.js          # Auth, ownership, Joi validation wrappers
├── schema.js              # Joi schemas for listing/review bodies
├── package.json
├── controllers/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── models/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── routes/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── views/
│   ├── layouts/boilerplate.ejs
│   ├── includes/          # navbar, footer, flash
│   ├── listings/          # index, show, new, edit
│   ├── users/             # login, signup
│   └── error.ejs
├── public/
│   ├── css/               # style.css, rating.css
│   └── js/script.js       # Bootstrap form validation helper
├── utils/
│   ├── ExpressError.js
│   └── wrapAsync.js
└── init/
    ├── index.js           # Optional DB seed script
    └── data.js            # Sample listing data
```

---

## 5. Prerequisites

- **Node.js** 20.x (matches `engines` in `package.json`)
- A **MongoDB** instance (local or **MongoDB Atlas**)
- A **Cloudinary** account (for listing image uploads in create/update flows)
- **npm** (or compatible client) to install dependencies

---

## 6. Installation and local run

1. Clone the repository and open the project folder.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (see [Environment variables](#7-environment-variables)).

4. Start the app (Express does not define a `start` script in `package.json`; run Node directly):

   ```bash
   node app.js
   ```

5. Open a browser at **http://localhost:8080** (port is fixed in `app.js`).

---

## 7. Environment variables

Load order: if `NODE_ENV` is **not** `production`, `dotenv` loads `.env` at startup (`app.js`).

| Variable | Purpose |
|----------|---------|
| `ATLASDB_URL` | MongoDB connection string used by Mongoose in `app.js` |
| `SECRET` | Session secret and `connect-mongo` crypto secret |
| `CLOUD_NAME` | Cloudinary cloud name |
| `CLOUD_API_KEY` | Cloudinary API key |
| `CLOUD_API_SECRET` | Cloudinary API secret |

**`.gitignore`** excludes `.env` so secrets are not committed.

---

## 8. Application entry (`app.js`)

- Connects to MongoDB with `mongoose.connect(dbUrl)` where `dbUrl = process.env.ATLASDB_URL`.
- Sets **EJS** as the view engine and default layout `layouts/boilerplate`.
- Registers **express-ejs-layouts**, static files from `public/`, URL-encoded body parser, **method-override** (`_method`).
- Configures **session** with **MongoStore** (`connect-mongo`), **flash**, **Passport** initialize/session, **LocalStrategy** using `User.authenticate()`.
- Exposes to all templates: `success`, `error` (flash), `currUser` (`req.user`).
- Mounts routes:
  - `/listings` → `routes/listing.js`
  - `/listings/:id/reviews` → `routes/review.js` (`mergeParams: true` in review router)
  - `/` → `routes/user.js` (signup, login, logout)
- **404**: any other path → `ExpressError(404, "Page Not FOUND")`.
- **Error middleware**: renders `error.ejs` with status and message.
- Listens on **port 8080**.

---

## 9. HTTP routes

### User routes (`routes/user.js`, mounted at `/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/signup` | Sign-up form |
| POST | `/signup` | Create user; auto login on success |
| GET | `/login` | Login form |
| POST | `/login` | Local auth; uses `saveRedirectUrl` then redirects to saved URL or `/listings` |
| GET | `/logout` | Log out |

### Listing routes (`routes/listing.js`, mounted at `/listings`)

| Method | Path | Middleware / notes |
|--------|------|----------------------|
| GET | `/listings` | All listings (index) |
| GET | `/listings/new` | New listing form — **requires login** |
| POST | `/listings` | Create — **login**, **multer** `listing[image]`, **validateListing** |
| GET | `/listings/:id` | Show one listing + reviews |
| GET | `/listings/:id/edit` | Edit form — **login**, **isOwner** |
| PUT | `/listings/:id` | Update — **login**, **isOwner**, optional new image, **validateListing** |
| DELETE | `/listings/:id` | Delete — **login**, **isOwner** |

**Note:** The listing router file also defines a second `POST /` without `upload.single` — in Express the first matching route wins for a given method/path; behavior should be verified if you change route order.

### Review routes (`routes/review.js`, mounted at `/listings/:id/reviews`)

| Method | Path | Middleware |
|--------|------|------------|
| POST | `/` | **login**, **validateReview** — create review for listing `:id` |
| DELETE | `/:reviewId` | **login**, **isReviewAuthor** — delete review |

Nested params: `id` (listing) and `reviewId` come from the parent mount + child route.

---

## 10. Controllers

### `controllers/listing.js`

- **index** — `Listing.find({})`, render `listings/index.ejs`.
- **renderNewForm** — render `listings/new`.
- **showListing** — `findById` with populated `reviews` (and review `author`) and `owner`; missing listing flashes error and redirects.
- **createListing** — expects **Cloudinary** file on `req.file` (`path`, `filename`); builds `listing` from `req.body.listing`, sets `owner`, saves, redirect.
- **renderEditForm** — loads listing; serves thumbnail-style URL for preview (`/upload/w_250`).
- **updateListing** — `findByIdAndUpdate` with `req.body.listing`; if new file uploaded, updates `image`.
- **destroyListing** — `findByIdAndDelete`; listing schema hook deletes related reviews (see models).

### `controllers/review.js`

- **createReview** — loads listing, creates `Review` from `req.body.review`, sets `author`, pushes to `listing.reviews`, saves both, redirect.
- **destroyReview** — `$pull` review id from listing, `Review.findByIdAndDelete`, redirect.

### `controllers/user.js`

- **renderSignUpForm** / **renderLoginForm** — render EJS forms.
- **signUp** — `User.register` (passport-local-mongoose), then `req.login`, flash, redirect to `/listings`.
- **login** — flash success, redirect to `res.locals.redirectUrl` or `/listings`.
- **logout** — `req.logout`, flash, redirect to `/listings`.

---

## 11. Data models (Mongoose)

### `Listing` (`models/listing.js`)

Fields include: `title`, `description`, `image: { url, filename }`, `price`, `location`, `country`, `reviews[]` (ObjectIds ref `Review`), `owner` (ObjectId ref `User`).

**Post hook** `findOneAndDelete`: when a listing is deleted, **deletes all reviews** whose `_id` is in `listing.reviews`.

### `Review` (`models/review.js`)

Fields: `comment`, `rating` (1–5), `createdAt` (default `Date.now`), `author` (ref `User`).

### `User` (`models/user.js`)

- `email` (required, unique)
- **passport-local-mongoose** plugin adds `username`, `hash`, `salt`, and methods like `authenticate()`, `register()`, `serializeUser()` / `deserializeUser()` integration.

---

## 12. Validation (`schema.js`)

**Joi** validates nested bodies:

- **listing** — `listing.title`, `listing.description`, `listing.location`, `listing.country`, `listing.price` (number, min 0), `listing.image` (string, optional empty).
- **review** — `review.rating` (1–5), `review.comment` (required).

Middleware in `middleware.js` throws `ExpressError(400, …)` on failure.

---

## 13. Middleware

| Export | Role |
|--------|------|
| `isLoggedIn` | If not authenticated, stores `redirectUrl`, flash error, redirect `/login`. |
| `saveRedirectUrl` | Copies `req.session.redirectUrl` to `res.locals.redirectUrl` for post-login redirect. |
| `isOwner` | Loads listing by `id`; compares `listing.owner` to `currUser._id`. |
| `validateListing` / `validateReview` | Joi validation. |
| `isReviewAuthor` | Loads review by `reviewId`; compares `review.author` to `currUser._id`. |

---

## 14. Utilities

- **`wrapAsync(fn)`** — Wraps async route handlers to forward rejections to Express `next(err)`.
- **`ExpressError`** — Custom error with `statusCode` and `message` for consistent error pages.

---

## 15. Cloudinary and file uploads

`cloudConfig.js` configures **Cloudinary** and exports **Multer** storage (`folder: "NamasteStay_DEV"`, allowed formats **png, jpg, jpeg**).

Listing **create** and **update** use `upload.single("listing[image]")` so the form field name must match.

---

## 16. Views (EJS) and static assets

- **Layout:** `views/layouts/boilerplate.ejs` — navbar, flash partial, `<%- body %>`, footer, Bootstrap/Font Awesome/Google Fonts CDN, links to `/css/style.css` and `/css/rating.css`.
- **Flash:** `views/includes/flash.ejs` — shows `success` / `error` from `res.locals`.
- **Listings:** `index`, `show`, `new`, `edit` under `views/listings/`.
- **Users:** `signup`, `login` under `views/users/`.
- **`error.ejs`** — generic error page from error middleware.

**`public/js/script.js`** — enables Bootstrap-style client-side validation for elements with class `needs-validation`.

---

## 17. Database seeding (`init/`)

- **`init/data.js`** — Exports `{ data: sampleListings }` (array of sample listings with Unsplash image URLs).
- **`init/index.js`** — Connects with `mongoose.connect(MONGO_URL)` (you must define `MONGO_URL` in the environment when running this script), clears `Listing` collection, assigns a fixed `owner` ObjectId and normalizes `image`, then `insertMany`.

Run seeding only when you intend to reset listings; adjust `owner` to a real `User` id in your database if needed.

---

## 18. Error handling

- Route handlers use `wrapAsync` to pass async errors to Express.
- Thrown `ExpressError` instances set HTTP status (e.g. 400 validation, 404 not found).
- Final handler renders `error.ejs` with the message.

---

## 19. Session and authentication flow

1. User hits a protected action → `isLoggedIn` may set `req.session.redirectUrl` and redirect to `/login`.
2. After successful login, `saveRedirectUrl` exposes `redirectUrl`; controller redirects there or to `/listings`.
3. Session cookie: **7 days** (`expires` / `maxAge`), **httpOnly**.

---

## 20. Deployment notes

- Set `NODE_ENV=production` in production so `dotenv` is not required if variables are injected by the host (e.g. Render).
- Ensure **MongoDB Atlas** allows connections from the deployment IP / `0.0.0.0/0` as appropriate.
- **Cloudinary** credentials must be set on the server.
- Default listen port is **8080**; platforms like Render often set `PORT` — you may want `process.env.PORT || 8080` for portability (optional code change).

---

## 21. Known quirks and maintenance notes

1. **`app.js` session store error handler** — `store.on("error", …)` references `err` without defining it; should be `(error)` or similar to avoid a `ReferenceError` if the store errors.
2. **`init/index.js`** — Uses `MONGO_URL`; the main app uses `ATLASDB_URL`. Use the correct variable when seeding.
3. **`routes/listing.js`** — Duplicate `POST /` definitions; rely on the first matching handler or remove the duplicate for clarity.
4. **`controllers/user.js` `signUp`** — `next(err)` is used but `next` is not passed into the controller; on login error after register, handle errors consistently (e.g. pass `next` from route or use `try/catch` with redirect).
5. **Search/filter** — README mentions search/filter; confirm in UI — core listing controller currently lists all with `find({})`.

---

## Document history

- Generated to reflect the codebase structure and behavior as of the documentation date. Update this file when routes, env vars, or architecture change.
