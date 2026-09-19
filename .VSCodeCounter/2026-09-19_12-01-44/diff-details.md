# Diff Details

Date : 2026-09-19 12:01:44

Directory c:\\Users\\terez\\Documents\\adaptLearn\\frontend

Total : 47 files,  10820 codes, 303 comments, 881 blanks, all 12004 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/app.py](/backend/app.py) | Python | -262 | -11 | -49 | -322 |
| [backend/models.py](/backend/models.py) | Python | -124 | 0 | -26 | -150 |
| [backend/requirements.txt](/backend/requirements.txt) | pip requirements | -39 | 0 | -1 | -40 |
| [backend/routes/\_\_init\_\_.py](/backend/routes/__init__.py) | Python | 0 | 0 | -1 | -1 |
| [backend/routes/auth.py](/backend/routes/auth.py) | Python | -213 | -21 | -44 | -278 |
| [backend/routes/bookmarks.py](/backend/routes/bookmarks.py) | Python | -82 | -1 | -22 | -105 |
| [backend/routes/courses.py](/backend/routes/courses.py) | Python | -179 | -1 | -44 | -224 |
| [backend/routes/sessions.py](/backend/routes/sessions.py) | Python | -126 | -5 | -27 | -158 |
| [backend/routes/user.py](/backend/routes/user.py) | Python | -60 | -2 | -20 | -82 |
| [backend/services/claude\_service.py](/backend/services/claude_service.py) | Python | -71 | -3 | -17 | -91 |
| [frontend/README.md](/frontend/README.md) | Markdown | 9 | 0 | 8 | 17 |
| [frontend/eslint.config.js](/frontend/eslint.config.js) | JavaScript | 20 | 0 | 2 | 22 |
| [frontend/index.html](/frontend/index.html) | HTML | 13 | 0 | 1 | 14 |
| [frontend/package-lock.json](/frontend/package-lock.json) | JSON | 3,685 | 0 | 1 | 3,686 |
| [frontend/package.json](/frontend/package.json) | JSON | 29 | 0 | 1 | 30 |
| [frontend/public/favicon.svg](/frontend/public/favicon.svg) | XML | 7 | 0 | 0 | 7 |
| [frontend/public/icons.svg](/frontend/public/icons.svg) | XML | 24 | 0 | 1 | 25 |
| [frontend/src/App.jsx](/frontend/src/App.jsx) | JavaScript JSX | 39 | 0 | 4 | 43 |
| [frontend/src/api.js](/frontend/src/api.js) | JavaScript | 2 | 0 | 0 | 2 |
| [frontend/src/assets/react.svg](/frontend/src/assets/react.svg) | XML | 1 | 0 | 0 | 1 |
| [frontend/src/assets/vite.svg](/frontend/src/assets/vite.svg) | XML | 1 | 0 | 1 | 2 |
| [frontend/src/components/AttemptBanner.jsx](/frontend/src/components/AttemptBanner.jsx) | JavaScript JSX | 8 | 0 | 1 | 9 |
| [frontend/src/components/ExplanationCard.jsx](/frontend/src/components/ExplanationCard.jsx) | JavaScript JSX | 26 | 0 | 1 | 27 |
| [frontend/src/components/Navbar.jsx](/frontend/src/components/Navbar.jsx) | JavaScript JSX | 122 | 1 | 9 | 132 |
| [frontend/src/components/QuizCard.jsx](/frontend/src/components/QuizCard.jsx) | JavaScript JSX | 117 | 3 | 17 | 137 |
| [frontend/src/components/RAGRating.jsx](/frontend/src/components/RAGRating.jsx) | JavaScript JSX | 30 | 0 | 0 | 30 |
| [frontend/src/components/SkeletonCard.jsx](/frontend/src/components/SkeletonCard.jsx) | JavaScript JSX | 13 | 0 | 0 | 13 |
| [frontend/src/components/StyleSelector.jsx](/frontend/src/components/StyleSelector.jsx) | JavaScript JSX | 27 | 0 | 1 | 28 |
| [frontend/src/components/TopicInput.jsx](/frontend/src/components/TopicInput.jsx) | JavaScript JSX | 31 | 0 | 4 | 35 |
| [frontend/src/context/ThemeContext.jsx](/frontend/src/context/ThemeContext.jsx) | JavaScript JSX | 16 | 0 | 5 | 21 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | 100 | 0 | 12 | 112 |
| [frontend/src/main.jsx](/frontend/src/main.jsx) | JavaScript JSX | 9 | 0 | 1 | 10 |
| [frontend/src/pages/Bookmarks.jsx](/frontend/src/pages/Bookmarks.jsx) | JavaScript JSX | 209 | 4 | 16 | 229 |
| [frontend/src/pages/CourseBuilder.jsx](/frontend/src/pages/CourseBuilder.jsx) | JavaScript JSX | 309 | 15 | 36 | 360 |
| [frontend/src/pages/CourseDetail.jsx](/frontend/src/pages/CourseDetail.jsx) | JavaScript JSX | 641 | 15 | 53 | 709 |
| [frontend/src/pages/Courses.jsx](/frontend/src/pages/Courses.jsx) | JavaScript JSX | 137 | 1 | 10 | 148 |
| [frontend/src/pages/Dashboard.jsx](/frontend/src/pages/Dashboard.jsx) | JavaScript JSX | 334 | 10 | 41 | 385 |
| [frontend/src/pages/History.jsx](/frontend/src/pages/History.jsx) | JavaScript JSX | 271 | 12 | 30 | 313 |
| [frontend/src/pages/Landing.jsx](/frontend/src/pages/Landing.jsx) | JavaScript JSX | 150 | 6 | 14 | 170 |
| [frontend/src/pages/Learn.jsx](/frontend/src/pages/Learn.jsx) | JavaScript JSX | 543 | 16 | 44 | 603 |
| [frontend/src/pages/Login.jsx](/frontend/src/pages/Login.jsx) | JavaScript JSX | 73 | 0 | 13 | 86 |
| [frontend/src/pages/Onboarding.jsx](/frontend/src/pages/Onboarding.jsx) | JavaScript JSX | 246 | 3 | 26 | 275 |
| [frontend/src/pages/Register.jsx](/frontend/src/pages/Register.jsx) | JavaScript JSX | 191 | 10 | 35 | 236 |
| [frontend/src/pages/SessionDetail.jsx](/frontend/src/pages/SessionDetail.jsx) | JavaScript JSX | 229 | 11 | 21 | 261 |
| [frontend/src/pages/Settings.jsx](/frontend/src/pages/Settings.jsx) | JavaScript JSX | 395 | 11 | 52 | 458 |
| [frontend/src/styles/global.css](/frontend/src/styles/global.css) | PostCSS | 3,914 | 228 | 669 | 4,811 |
| [frontend/vite.config.js](/frontend/vite.config.js) | JavaScript | 5 | 1 | 2 | 8 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details