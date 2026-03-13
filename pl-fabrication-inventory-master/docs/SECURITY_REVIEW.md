# Security Review: PL Fabrication Inventory System

**Review Date:** 2024-03-13  
**Reviewer:** Senior Security Engineer (Automated Audit)  
**System:** LED Pain Therapy Device Fabrication Inventory  
**Version:** 1.0.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Security Score** | **B** |
| **Critical Issues** | 0 |
| **High Issues** | 2 |
| **Medium Issues** | 1 |
| **Low Issues** | 2 |
| **Production Ready** | ⚠️ Conditional (see recommendations) |

The PL Fabrication Inventory system demonstrates solid security fundamentals with proper use of SQLAlchemy ORM for SQL injection prevention, Pydantic for input validation, and React for XSS-safe rendering. However, there are **vulnerable dependencies that require immediate updates** before production deployment.

---

## Findings Summary

| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|
| 1 | 🔴 HIGH | Dependencies | `backend/requirements.txt` | `python-multipart` 0.0.9 has CVE-2024-53981, CVE-2026-24486 | Upgrade to ≥0.0.22 |
| 2 | 🔴 HIGH | Dependencies | `backend/` (transitive) | `starlette` 0.38.6 has CVE-2024-47874, CVE-2025-54121 | Upgrade FastAPI to get starlette ≥0.47.2 |
| 3 | 🟡 MEDIUM | CORS | `backend/app/main.py:47` | `allow_origins=["*"]` permits any origin | Configure specific origins |
| 4 | 🟢 LOW | Rate Limiting | `backend/app/routers/*` | No rate limiting on API endpoints | Add slowapi or similar |
| 5 | 🟢 LOW | Error Handling | `backend/app/routers/boms.py:71` | IntegrityError leaks constraint name | Sanitize error messages |

---

## Detailed Findings

### 1. 🔴 HIGH: Vulnerable `python-multipart` Package

**Location:** `backend/requirements.txt`, line 13  
**Current Version:** 0.0.9

**CVEs:**
- **CVE-2024-53981**: Denial of Service vulnerability
- **CVE-2026-24486**: Additional security issue (fix requires 0.0.22+)

**Impact:** An attacker could exploit multipart form handling to cause denial of service.

**Remediation:**
```diff
- python-multipart==0.0.9
+ python-multipart>=0.0.22
```

---

### 2. 🔴 HIGH: Vulnerable `starlette` (FastAPI dependency)

**Location:** Transitive dependency via FastAPI  
**Current Version:** 0.38.6

**CVEs:**
- **CVE-2024-47874**: Security vulnerability (fix: 0.40.0+)
- **CVE-2025-54121**: Security vulnerability (fix: 0.47.2+)

**Impact:** Web framework vulnerabilities could allow various attacks.

**Remediation:**
```diff
- fastapi==0.115.0
+ fastapi>=0.115.6
```
Then verify starlette is upgraded:
```bash
pip install --upgrade fastapi
pip show starlette  # Should be ≥0.47.2
```

---

### 3. 🟡 MEDIUM: Overly Permissive CORS Configuration

**Location:** `backend/app/main.py`, lines 47-52

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Allows any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Impact:** Any website can make API requests, potentially enabling CSRF-like attacks if combined with `allow_credentials=True`.

**Remediation:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "https://your-production-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

### 4. 🟢 LOW: No API Rate Limiting

**Location:** All routers in `backend/app/routers/`

**Impact:** API is vulnerable to brute force and denial of service attacks.

**Remediation:** Add rate limiting using `slowapi`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("", response_model=ComponentResponse)
@limiter.limit("30/minute")
def create_component(...):
```

---

### 5. 🟢 LOW: Database Constraint Name in Error Response

**Location:** `backend/app/routers/boms.py`, line 71

```python
except IntegrityError as e:
    if "uq_bom_name_version" in str(e):  # Exposes internal constraint name
```

**Impact:** Minor information disclosure about database schema.

**Remediation:** Use generic error messages without referencing internal names.

---

## Security Strengths ✅

### SQL Injection Prevention
All database operations use SQLAlchemy ORM with parameterized queries:
```python
# ✅ Safe - uses ORM filtering
query = query.filter(Component.category == category)

# ✅ Safe - parameterized LIKE
query = query.filter(Component.name.ilike(search_term))
```

### Input Validation
Comprehensive Pydantic schemas with strict validation:
```python
class ComponentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    quantity_on_hand: int = Field(default=0, ge=0)
    unit_cost: float = Field(default=0.0, ge=0)
```

### XSS Prevention
- React/TypeScript frontend with JSX escaping
- No `dangerouslySetInnerHTML` usage found
- No `eval()` or `innerHTML` in codebase

### No Hardcoded Secrets
Configuration uses `pydantic-settings` with `.env` file support:
```python
class Settings(BaseSettings):
    database_url: str = "sqlite:///./pl_inventory.db"
    class Config:
        env_file = ".env"
```

### Clean Frontend Dependencies
```
npm audit: found 0 vulnerabilities
```

### Authentication Design
Per specification, single-operator system does not require authentication. No admin/dangerous endpoints are exposed publicly (all operations are standard CRUD).

---

## Dependency Audit Results

### Python (pip-audit)
| Package | Version | Vulnerabilities | Required Version |
|---------|---------|-----------------|------------------|
| python-multipart | 0.0.9 | 2 CVEs | ≥0.0.22 |
| starlette | 0.38.6 | 2 CVEs | ≥0.47.2 |
| fastapi | 0.115.0 | 0 | current |
| sqlalchemy | 2.0.35 | 0 | current |
| pydantic | 2.9.2 | 0 | current |
| uvicorn | 0.30.6 | 0 | current |

### Node.js (npm audit)
```
found 0 vulnerabilities
```

---

## Recommendations

### Immediate (Before Production)

1. **Update vulnerable packages:**
   ```bash
   cd backend
   pip install "python-multipart>=0.0.22" "fastapi>=0.115.6"
   pip freeze | grep -E "(python-multipart|starlette|fastapi)" > updated_deps.txt
   ```

2. **Configure CORS for production:**
   ```python
   allow_origins=["https://your-domain.com"]
   ```

### Short-term (Within 30 days)

3. **Add rate limiting** to prevent abuse
4. **Configure SQLite file permissions** (mode 0600) in production
5. **Add request logging** for audit trails

### Long-term (Within 90 days)

6. **Consider PostgreSQL** for production (better concurrent access)
7. **Add health check authentication** or move to internal network only
8. **Implement API versioning** (currently no version prefix)

---

## Production Readiness Verdict

### ⚠️ CONDITIONAL APPROVAL

The system is **architecturally sound** with good security practices, but requires:

| Requirement | Status | Action |
|-------------|--------|--------|
| Update python-multipart | ❌ Required | Upgrade to ≥0.0.22 |
| Update starlette | ❌ Required | Upgrade FastAPI |
| Configure CORS | ❌ Required | Set specific origins |
| Rate limiting | ⚠️ Recommended | Add before heavy use |

**After addressing HIGH severity items, the system is approved for production deployment.**

---

## Appendix: Files Reviewed

```
backend/
├── app/
│   ├── main.py          ✅ Reviewed
│   ├── config.py        ✅ Reviewed
│   ├── database.py      ✅ Reviewed
│   ├── models/models.py ✅ Reviewed
│   ├── schemas/schemas.py ✅ Reviewed
│   └── routers/
│       ├── components.py   ✅ Reviewed
│       ├── suppliers.py    ✅ Reviewed
│       ├── boms.py         ✅ Reviewed
│       ├── fabrication.py  ✅ Reviewed
│       ├── devices.py      ✅ Reviewed
│       └── reports.py      ✅ Reviewed
├── requirements.txt     ✅ Audited
frontend/
├── package.json        ✅ Audited
├── vite.config.ts      ✅ Reviewed
└── src/                ✅ Reviewed (no XSS vectors)
```

---

*Security review completed. For questions, contact the security team.*
