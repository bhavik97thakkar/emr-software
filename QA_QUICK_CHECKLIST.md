# ⚡ QUICK QA TESTING CHECKLIST

## MedCore EMR — Fast Reference for Testing

**Use this for daily/weekly QA cycles**

---

## 🚀 QUICK START TEST (15 minutes)

```
[ ] 1. Open https://emr-aarti.netlify.app
[ ] 2. Login: demo@medcore.in / demo123
[ ] 3. Check green "Cloud Synced" badge (top-right)
[ ] 4. Click "NEW PATIENT"
    [ ] Name: "Test Patient"
    [ ] Mobile: "9876543210"
    [ ] Blood: "O+"
    [ ] Click SAVE
[ ] 5. Check patient appears in list
[ ] 6. Click patient → NEW VISIT
    [ ] Diagnosis: "Common Cold"
    [ ] Amount: "500"
    [ ] Click SAVE
[ ] 7. Wait 10 seconds (auto-sync)
[ ] 8. Check DevTools Console: "✓ Auto-sync successful"
[ ] 9. Click Cloud icon → Pull from Cloud
[ ] 10. Verify data persisted → SUCCESS ✅
```

---

## 🔐 AUTHENTICATION TEST (5 minutes)

| Test                | Action                    | Expected            | Status |
| ------------------- | ------------------------- | ------------------- | ------ |
| Valid login         | demo@medcore.in / demo123 | Dashboard appears   | [ ]    |
| Invalid password    | demo@medcore.in / wrong   | Error message       | [ ]    |
| Invalid email       | wrong@email.com / demo123 | Error/validation    | [ ]    |
| Logout              | Click Logout button       | Redirected to login | [ ]    |
| Session persistence | F5 refresh browser        | Still logged in     | [ ]    |

---

## 👥 PATIENT MANAGEMENT TEST (10 minutes)

| Test             | Action                             | Expected        | Status |
| ---------------- | ---------------------------------- | --------------- | ------ |
| Create patient   | Name + Mobile → Save               | Patient in list | [ ]    |
| Search patient   | Type name in search                | List filters    | [ ]    |
| View patient     | Click patient row                  | Profile opens   | [ ]    |
| Edit patient     | Change address → Save              | Updated in list | [ ]    |
| Delete patient   | Click delete → Confirm             | Patient removed | [ ]    |
| Duplicate mobile | Save with same mobile as patient 1 | Error shown     | [ ]    |

---

## ☁️ CLOUD SYNC TEST (15 minutes)

### Auto-Sync Verification

```
[ ] 1. Open DevTools (F12) → Console
[ ] 2. Create new patient: "Sync Test Patient"
[ ] 3. Wait 10 seconds
[ ] 4. Look for log: "✓ Auto-sync successful at HH:MM:SS"
[ ] 5. Open new browser tab
[ ] 6. Login again
[ ] 7. Click Cloud → Pull from Cloud
[ ] 8. Patient appears in new tab → ✅ SYNC WORKING
```

### Manual Sync Test

```
[ ] 1. Create patient: "Manual Sync Test"
[ ] 2. Click Cloud icon (top-right)
[ ] 3. Click "Push to Cloud"
[ ] 4. Wait for green toast: "Pushed 1 patient"
[ ] 5. In another browser → Pull from Cloud
[ ] 6. Patient appears → ✅ MANUAL SYNC WORKING
```

### Offline Mode Test

```
[ ] 1. Login, create patient: "Offline Test"
[ ] 2. DevTools → Network → Offline
[ ] 3. Badge turns red "Local Only"
[ ] 4. Create another patient (should work locally)
[ ] 5. DevTools → Network → Online
[ ] 6. Badge turns green "Cloud Synced"
[ ] 7. Auto-sync runs (check console logs)
[ ] 8. New tab: Pull from Cloud
[ ] 9. Both patients appear → ✅ OFFLINE WORKING
```

---

## 📋 VISIT & CLINICAL TEST (10 minutes)

| Test                | Action                                | Expected            | Status |
| ------------------- | ------------------------------------- | ------------------- | ------ |
| Create visit        | Patient → New Visit → Save            | Visit in history    | [ ]    |
| Edit visit          | Click visit → Change diagnosis → Save | Updated             | [ ]    |
| Add medicines       | Visit → Add 2+ medicines → Save       | All medicines saved | [ ]    |
| Record vitals       | Enter BP, temp, pulse → Save          | Vitals stored       | [ ]    |
| Upload report       | Click report → Choose file → Upload   | File stored         | [ ]    |
| Export prescription | Click print → PDF opens               | Download works      | [ ]    |

---

## 📅 APPOINTMENTS TEST (5 minutes)

| Test                 | Action                              | Expected            | Status |
| -------------------- | ----------------------------------- | ------------------- | ------ |
| Schedule appointment | Patient → Date/Time → Reason → Save | Appointment created | [ ]    |
| View appointments    | Appointments tab                    | List shows all      | [ ]    |
| Change status        | Mark as Completed                   | Status updates      | [ ]    |
| Delete appointment   | Click delete → Confirm              | Removed             | [ ]    |

---

## 📊 REPORTS TEST (10 minutes)

| Test           | Action                          | Expected             | Status |
| -------------- | ------------------------------- | -------------------- | ------ |
| Revenue Report | Reports → Revenue → Select date | Chart displays       | [ ]    |
| Patient Report | Reports → Demographics → Load   | Age/gender breakdown | [ ]    |
| Lab Results    | Reports → Lab Results → Load    | Upload list shown    | [ ]    |
| Export CSV     | Reports → Export → CSV          | Download works       | [ ]    |
| Print Report   | Reports → Print                 | Print dialog opens   | [ ]    |

---

## 🎤 VOICE INPUT TEST (5 minutes)

| Test          | Action                                         | Expected           | Status |
| ------------- | ---------------------------------------------- | ------------------ | ------ |
| Open voice    | New Visit → Click 🎤 icon                      | Recording starts   | [ ]    |
| Say diagnosis | "Patient ko diabetes hai, paracetamol de diya" | Text appears       | [ ]    |
| Parse data    | Check extracted diagnosis/medicines            | Fields auto-filled | [ ]    |
| Submit        | Edit if needed, Save visit                     | Visit created      | [ ]    |

---

## ⚙️ PERFORMANCE TEST (5 minutes)

| Test                    | Metric          | Target      | Status |
| ----------------------- | --------------- | ----------- | ------ |
| Login response          | /auth/login API | < 100ms     | [ ]    |
| Patient create          | /patients POST  | < 200ms     | [ ]    |
| Load patient list (100) | /patients GET   | < 500ms     | [ ]    |
| Auto-sync time          | /sync/push-all  | < 2 seconds | [ ]    |
| Page load               | First paint     | < 3 seconds | [ ]    |

---

## 🔒 SECURITY TEST (5 minutes)

| Test              | Action                          | Expected           | Status |
| ----------------- | ------------------------------- | ------------------ | ------ |
| HTTPS             | Open URLs                       | Green lock icon    | [ ]    |
| Login page HTTPS  | Go to login                     | Protocol is https  | [ ]    |
| API HTTPS         | Network tab → API calls         | All https          | [ ]    |
| Rate limit        | Rapidly click sync 120+ times   | 429 error on 101st | [ ]    |
| Session isolation | Two browsers → different logins | Each sees own data | [ ]    |

---

## 📱 MOBILE RESPONSIVE TEST (5 minutes)

| Device          | Test                           | Status |
| --------------- | ------------------------------ | ------ |
| iPhone          | Tap buttons, view list scrolls | [ ]    |
| iPad            | List → patient → works         | [ ]    |
| Android         | Voice input, sync works        | [ ]    |
| Desktop (small) | Sidebar collapses              | [ ]    |

---

## 🔧 ERROR HANDLING TEST (5 minutes)

| Test               | Action                         | Expected         | Status |
| ------------------ | ------------------------------ | ---------------- | ------ |
| Empty field        | Try save without name          | Error shown      | [ ]    |
| Invalid mobile     | Enter "123" (too short)        | Validation error | [ ]    |
| Network timeout    | Disable internet, try to login | Error message    | [ ]    |
| Backend down       | Render down, try to sync       | Graceful error   | [ ]    |
| Local storage full | Add 1000+ records              | App still works  | [ ]    |

---

## 📈 DATABASE INTEGRITY TEST (10 minutes)

| Test                 | Action                                          | Expected             | Status |
| -------------------- | ----------------------------------------------- | -------------------- | ------ |
| Check patients count | MongoDB → emr_dr_aarti → patients               | Count accurate       | [ ]    |
| Check visits count   | MongoDB → visits collection                     | Matches created      | [ ]    |
| Check foreign keys   | Random visit → patientMobile exists in patients | Valid FK             | [ ]    |
| Check indexes        | MongoDB → Indexes tab                           | mobile, date indexed | [ ]    |
| Check backup         | MongoDB → Snapshots                             | Recent backup exists | [ ]    |

---

## 🚨 BUG REPORT TEMPLATE

**Found an issue? Use this format:**

```markdown
## Bug Title

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshots/Video:**
[Attach if possible]

**Environment:**

- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- URL: [emr-aarti.netlify.app]

**Additional Info:**
[Any extra context]
```

---

## 📊 TEST FREQUENCY SCHEDULE

| Frequency         | Tests                                       | Owner     |
| ----------------- | ------------------------------------------- | --------- |
| **Daily**         | Quick Start (15 min)                        | QA        |
| **Twice Weekly**  | Full Authentication + Patient Mgmt (20 min) | QA        |
| **Weekly**        | Cloud Sync Deep Dive (30 min)               | QA Lead   |
| **Every 2 weeks** | Full QA Report (2-3 hours)                  | Senior QA |
| **Pre-Release**   | Full Test Suite (8 hours)                   | QA Team   |

---

## ✅ SIGN-OFF CHECKLIST

Before releasing to Dr. Aarti, confirm:

- [ ] All 142 test cases passed or documented
- [ ] No critical/high-severity bugs remaining
- [ ] Performance metrics within target
- [ ] Security audit complete
- [ ] Database is clean (0 patients)
- [ ] Admin credentials tested and working
- [ ] URLs are live and accessible
- [ ] Team approval obtained
- [ ] Rollback plan documented

**QA Team Sign-off:** ********\_\_\_********  
**Date:** ********\_\_\_********  
**Version Tested:** 1.0.0

---

**Last Updated:** 2026-03-17  
**Next Review:** Post-demo feedback
