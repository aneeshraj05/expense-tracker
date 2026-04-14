# Expense Tracker Application

A full-stack Expense Tracker web application that helps users manage their daily expenses, track spending patterns, and set monthly budgets efficiently.



---

## Screenshots

> Add your application images here

### Dashboard

<img width="1919" height="1028" alt="image" src="https://github.com/user-attachments/assets/8ca2261f-8b86-4c8e-95f0-696fd927bd24" />


### Add Expense

<img width="1919" height="1032" alt="image" src="https://github.com/user-attachments/assets/7a7e36f7-6531-47d8-bdc1-2e6758ded843" />


### Analytics

<img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/ac0de03e-d678-46f7-9ce0-50527f4fe5ce" />


---


---

## Features

### Authentication

* User registration and login
* Secure password hashing using bcrypt
* JWT-based authentication

### Expense Management

* Add, update, and delete expenses
* Categorize expenses (Food, Travel, Bills, etc.)
* Filter expenses by category, date, and search

### Dashboard and Analytics

* Total spending overview
* Category-wise expense breakdown
* Monthly trends (last 6 months)
* Recent transactions

### Budget Tracking

* Set monthly budgets
* Track spending vs budget
* Remaining balance calculation
* Budget exceeded alerts

---

## Tech Stack

### Frontend

* React.js
* Axios
* CSS / Tailwind

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt

### Database

* MySQL (Railway)

---

## Project Structure

```plaintext
expense-tracker/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── setup-database.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── build/
│   └── package.json
│
└── README.md
```



## Environment Variables

### Backend (.env)

```env
DB_HOST=your_host
DB_PORT=your_port
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_secret_key
```

### Frontend (.env)

```env
REACT_APP_API_URL=your_backend_url
```

---

## Installation

```bash
git clone https://github.com/aneeshraj05/expense-tracker.git
cd expense_tracker
```

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Deployment

* Frontend deployed on Render
* Backend deployed on Render / Railway
* Database hosted on Railway

---

## Future Improvements

* Charts and advanced analytics
* Notifications for budget limits
* Recurring expenses
* Improved UI/UX

---

## License

This project is licensed under the MIT License.
