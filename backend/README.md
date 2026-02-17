# Portfolio Backend API

## Quick Start

```bash
cd backend
cp .env.example .env        # edit MONGODB_URI if needed
pnpm install
pnpm dev                    # starts with nodemon
```

Production: `pnpm start`

---

## Folder Structure

```
backend/
├── config/
│   ├── db.js               # MongoDB connection
│   └── constants.js        # Enums & allowed values
├── controllers/
│   └── portfolioController.js
├── middleware/
│   ├── asyncHandler.js     # Async error wrapper
│   ├── errorHandler.js     # Global error handler
│   └── validators.js       # express-validator rules
├── models/
│   └── Portfolio.js        # Mongoose schema
├── routes/
│   └── portfolioRoutes.js  # API route definitions
├── utils/
│   ├── ApiError.js         # Custom error class
│   └── sendResponse.js     # Standardised JSON responses
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js               # Entry point
└── README.md
```

---

## API Endpoints

| Method   | Endpoint                                        | Description                          |
| -------- | ----------------------------------------------- | ------------------------------------ |
| `GET`    | `/api/health`                                   | Health check                         |
| `POST`   | `/api/portfolio`                                | Create portfolio                     |
| `GET`    | `/api/portfolio`                                | Get active portfolio                 |
| `DELETE` | `/api/portfolio`                                | Delete portfolio                     |
| `GET`    | `/api/portfolio/section/:section`               | Get a specific section               |
| `PATCH`  | `/api/portfolio/section/:section`               | Update a section (partial)           |
| `POST`   | `/api/portfolio/section/:section/item`          | Add item to array section            |
| `PATCH`  | `/api/portfolio/section/:section/item/:itemId`  | Update item in array section         |
| `DELETE` | `/api/portfolio/section/:section/item/:itemId`  | Delete item from array section       |
| `POST`   | `/api/portfolio/skills`                         | Add skill (with validation)          |
| `POST`   | `/api/portfolio/projects`                       | Add project (with validation)        |
| `POST`   | `/api/portfolio/social-links`                   | Add social link                      |
| `DELETE` | `/api/portfolio/social-links/:linkId`           | Delete social link                   |

**Allowed sections:** `personalDetails`, `skills`, `projects`, `experience`, `education`, `resume`

---

## Example Request Bodies

### 1. Create Portfolio — `POST /api/portfolio`

```json
{
  "personalDetails": {
    "firstName": "Riyaz",
    "lastName": "Ahmad J",
    "title": "Associate Software Engineer",
    "bio": "Passionate full-stack developer with expertise in modern web technologies.",
    "email": "riyazofficial.222001@gmail.com",
    "phone": "+91-9876543210",
    "location": "India",
    "avatar": "https://example.com/avatar.jpg",
    "socialLinks": [
      {
        "platform": "GitHub",
        "url": "https://github.com/riyaz-22",
        "icon": "logo-github"
      },
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/riyaz-ahmad",
        "icon": "logo-linkedin"
      }
    ]
  },
  "skills": [
    {
      "category": "Frontend",
      "name": "React.js",
      "proficiency": "Advanced",
      "icon": "react-icon"
    },
    {
      "category": "Backend",
      "name": "Node.js",
      "proficiency": "Advanced",
      "icon": "node-icon"
    },
    {
      "category": "Database",
      "name": "MongoDB",
      "proficiency": "Intermediate",
      "icon": "mongo-icon"
    }
  ],
  "projects": [
    {
      "title": "Portfolio Website",
      "description": "A premium portfolio website built with modern technologies.",
      "techStack": ["HTML", "CSS", "JavaScript", "Node.js", "MongoDB"],
      "githubUrl": "https://github.com/riyaz-22/MyPortfolio",
      "liveUrl": "https://riyaz-portfolio.com",
      "images": ["https://example.com/project1.png"],
      "featured": true,
      "order": 1
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Associate Software Engineer",
      "startDate": "2023-06-01",
      "endDate": null,
      "current": true,
      "description": "Working on full-stack web applications.",
      "responsibilities": [
        "Developing RESTful APIs",
        "Building responsive UIs",
        "Code reviews and mentoring"
      ],
      "location": "India",
      "order": 1
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Engineering",
      "field": "Computer Science",
      "startYear": 2019,
      "endYear": 2023,
      "grade": "8.5 CGPA",
      "description": "Specialized in software engineering and web development.",
      "order": 1
    }
  ],
  "resume": {
    "fileUrl": "https://example.com/resume.pdf",
    "lastUpdated": "2026-02-01"
  }
}
```

### 2. Update Personal Details — `PATCH /api/portfolio/section/personalDetails`

```json
{
  "title": "Software Engineer",
  "bio": "Updated bio with new achievements.",
  "location": "Bangalore, India"
}
```

### 3. Update Resume — `PATCH /api/portfolio/section/resume`

```json
{
  "fileUrl": "https://example.com/resume-v2.pdf",
  "lastUpdated": "2026-02-17"
}
```

### 4. Add a Skill — `POST /api/portfolio/skills`

```json
{
  "category": "Frontend",
  "name": "TypeScript",
  "proficiency": "Intermediate",
  "icon": "ts-icon"
}
```

### 5. Add a Project — `POST /api/portfolio/projects`

```json
{
  "title": "E-Commerce App",
  "description": "Full-stack e-commerce application with payment integration.",
  "techStack": ["React", "Node.js", "MongoDB", "Stripe"],
  "githubUrl": "https://github.com/riyaz-22/ecommerce",
  "liveUrl": "https://ecommerce-demo.com",
  "featured": false,
  "order": 2
}
```

### 6. Update a Skill — `PATCH /api/portfolio/section/skills/item/:itemId`

```json
{
  "proficiency": "Expert"
}
```

### 7. Delete a Project — `DELETE /api/portfolio/section/projects/item/:itemId`

No body required.

### 8. Add Social Link — `POST /api/portfolio/social-links`

```json
{
  "platform": "Twitter",
  "url": "https://twitter.com/riyaz",
  "icon": "logo-twitter"
}
```

### 9. Add Experience — `POST /api/portfolio/section/experience/item`

```json
{
  "company": "StartupXYZ",
  "role": "Frontend Developer",
  "startDate": "2022-01-15",
  "endDate": "2023-05-30",
  "current": false,
  "description": "Built responsive web apps using React and Next.js.",
  "responsibilities": ["UI/UX implementation", "Performance optimization"],
  "location": "Remote"
}
```

### 10. Add Education — `POST /api/portfolio/section/education/item`

```json
{
  "institution": "Online Academy",
  "degree": "Full Stack Web Development Certificate",
  "field": "Web Development",
  "startYear": 2021,
  "endYear": 2022,
  "description": "Intensive full-stack bootcamp."
}
```
