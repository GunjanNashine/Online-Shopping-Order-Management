# AURA & FORMA — Online Shopping & Order Management System
## DevOps Laboratory Practical Application

A production-grade, editorial artisanal e-commerce web application engineered for DevOps laboratory demonstrations, automated Selenium WebDriver verification, and Docker/Jenkins CI/CD integration.

---

### Quick Start (Windows PowerShell)

```powershell
# 1. Navigate to project root
cd C:\Users\rupes\Desktop\Devopslab\Online-Shopping-Order-Management

# 2. Install Node.js dependencies
npm install

# 3. Run automated backend functional tests (18 tests)
npm test

# 4. Start the application
npm start
# or with hot reload:
npm run dev
```

Application URL: **http://localhost:3000** (listening on `0.0.0.0:3000` for Docker readiness)

---

### Demonstration Credentials

- **Customer Account**: `john@example.com` / `Customer@123`
- **Administrator Portal**: `admin@aurafoma.com` / `Admin@1234` (Access: `http://localhost:3000/login`)

---

### Run Selenium Automation Suite (16 Test Cases)

In a separate terminal while the application is running:

```powershell
mvn -f selenium-tests/pom.xml clean test -DbaseUrl=http://localhost:3000
```

---

### Project Documentation
- **Visual Design Profile**: See `DESIGN_PROFILE.md`
- **Complete Practical Manual & Viva Preparation**: See `PRACTICAL_MANUAL.md`
