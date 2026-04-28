# NamasteStay

**NamasteStay** is a full-stack **accommodation listing** web app: browse stays, create listings with photos, and leave reviews. Pages are rendered on the server with **EJS** (not a separate React frontend).



---

## Quick start

1. **Requirements:** Node.js 20.x, MongoDB (e.g. Atlas), Cloudinary account for images.

2. **Install**

   ```bash
   npm install
   ```

3. **Environment** — Create `.env` in the project root:

   | Variable | Description |
   |----------|-------------|
   | `ATLASDB_URL` | MongoDB connection string |
   | `SECRET` | Session secret (also used by session store crypto) |
   | `CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUD_API_KEY` | Cloudinary API key |
   | `CLOUD_API_SECRET` | Cloudinary API secret |

4. **Run**

   ```bash
   node app.js
   ```

   App listens on **http://localhost:8080** (see `app.js`).

---

## Full documentation

**[DOCUMENTATION.md](./DOCUMENTATION.md)** covers:

- Architecture (MVC), folder structure, and tech stack  
- Every route, controller, model, and middleware  
- Validation, sessions, Passport auth, Cloudinary uploads  
- Optional DB seeding (`init/`), deployment notes, and known quirks  

---

## Tech stack (summary)

| Area | Technologies |
|------|----------------|
| Backend | Node.js, Express |
| Views | EJS, express-ejs-layouts, Bootstrap 5 |
| Data | MongoDB, Mongoose |
| Auth | Passport (local), express-session, connect-mongo |
| Uploads | Multer, Cloudinary |

---

## Features

- Listings CRUD with **image upload** (Cloudinary)  
- **User signup / login / logout** (Passport local)  
- **Reviews** with ratings; owners can delete their own reviews  
- Listing **owners** can edit/delete only **their** listings  
- Flash messages, server-side validation (Joi), centralized error page  

---

## Screenshots

1. ![Screenshot 1](https://github.com/ShyamMohanvis/NamasteStay/blob/efecbab0b6c1ceba290711b1b8c174701a6d5ceb/Screenshot%20%201.png?raw=true)

2. ![Screenshot 2](https://github.com/ShyamMohanvis/NamasteStay/blob/efecbab0b6c1ceba290711b1b8c174701a6d5ceb/Screenshot%202.png?raw=true)

3. ![Screenshot 3](https://github.com/ShyamMohanvis/NamasteStay/blob/efecbab0b6c1ceba290711b1b8c174701a6d5ceb/Screenshot%203.png?raw=true)

4. ![Screenshot 4](https://github.com/ShyamMohanvis/NamasteStay/blob/efecbab0b6c1ceba290711b1b8c174701a6d5ceb/Screenshot%204.png?raw=true)

---

## Contributing

Contributions are welcome. Fork the repo and open a pull request; use issues for bugs.

---

## Author

**Shyam Mohan** — [GitHub @ShyamMohanvis](https://github.com/ShyamMohanvis)
