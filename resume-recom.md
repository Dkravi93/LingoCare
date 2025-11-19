resume-recommender/
├── 📄 README.md
├── 🛠️ package.json
├── 🔧 .env.example
├── 📁 client/
│   ├── 📄 package.json
│   ├── 📁 public/
│   │   └── 📄 index.html
│   └── 📁 src/
│       ├── 📄 App.js
│       ├── 📄 index.js
│       ├── 📁 components/
│       │   ├── 📄 FileUpload.js
│       │   ├── 📄 JobDescriptionInput.js
│       │   ├── 📄 ResultsPanel.js
│       │   ├── 📄 ResumeCard.js
│       │   └── 📄 Header.js
│       ├── 📁 pages/
│       │   └── 📄 Dashboard.js
│       ├── 📁 services/
│       │   └── 📄 api.js
│       ├── 📁 styles/
│       │   └── 📄 App.css
│       └── 📁 utils/
│           └── 📄 helpers.js
├── 📁 server/
│   ├── 📄 package.json
│   ├── 📄 server.js
│   ├── 📄 app.js
│   ├── 📁 controllers/
│   │   ├── 📄 uploadController.js
│   │   ├── 📄 analysisController.js
│   │   └── 📄 sessionController.js
│   ├── 📁 routes/
│   │   ├── 📄 uploadRoutes.js
│   │   ├── 📄 analysisRoutes.js
│   │   └── 📄 sessionRoutes.js
│   ├── 📁 middleware/
│   │   ├── 📄 upload.js
│   │   └── 📄 errorHandler.js
│   ├── 📁 services/
│   │   ├── 📄 pdfService.js
│   │   ├── 📄 aiService.js
│   │   └── 📄 similarityService.js
│   ├── 📁 models/
│   │   ├── 📄 Session.js
│   │   └── 📄 Resume.js
│   └── 📁 config/
│       └── 📄 database.js
└── 📁 uploads/
    ├── 📁 resumes/
    └── 📁 temp/
