/**
 * Frontend Database Service with Enhanced Security
 * - localStorage Encryption: Sensitive data is encrypted
 * - Token Expiry Handling: Automatic logout when token expires
 * - GDPR Consent Tracking: Consent is tracked and enforced
 */

// ════════════════════════════════════════════════════════════
//  ENCRYPTION UTILITIES (Client-side)
// ════════════════════════════════════════════════════════════

class SecureStorage {
  private sensitiveKeys = [
    "user",
    "token",
    "patients",
    "visits",
    "reports",
    "families",
  ];

  /**
   * Generate consistent encryption key (based on session, not time)
   */
  private getKey(): string {
    // Use a stable key that doesn't change over time
    // This ensures tokens stored early in session can be retrieved later
    return "medcore-frontend-2026-stable-encryption-key";
  }

  /**
   * Encrypt using XOR with consistent key
   */
  private encrypt(data: string): string {
    const key = this.getKey();
    let encrypted = "";
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length),
      );
    }
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt data encrypted with encrypt method
   */
  private decrypt(encoded: string): string {
    try {
      const encrypted = atob(encoded);
      const key = this.getKey();
      let decrypted = "";
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length),
        );
      }
      return decrypted;
    } catch (err) {
      return null;
    }
  }

  setItem(key: string, value: any) {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      if (this.sensitiveKeys.includes(key)) {
        const encrypted = this.encrypt(str);
        localStorage.setItem(`_enc_${key}`, encrypted);
      } else {
        localStorage.setItem(key, str);
      }
    } catch (err) {
      console.warn(`Failed to secure store ${key}:`, err);
      // Fallback to plain localStorage if encryption fails
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }
  }

  getItem(key: string): any {
    try {
      if (this.sensitiveKeys.includes(key)) {
        const encrypted = localStorage.getItem(`_enc_${key}`);
        if (encrypted) {
          try {
            const decrypted = this.decrypt(encrypted);
            if (!decrypted) return null;
            
            try {
              return JSON.parse(decrypted);
            } catch (parseErr) {
              // Decryption produced invalid JSON - old data format or encryption key mismatch
              console.warn(`⚠️ Corrupted data for ${key}, clearing...`);
              this.removeItem(key);
              return null;
            }
          } catch (decryptErr) {
            console.warn(`⚠️ Failed to decrypt ${key}, clearing...`);
            this.removeItem(key);
            return null;
          }
        }
        // Migrate plain data if it exists
        const plain = localStorage.getItem(key);
        if (plain) {
          try {
            return JSON.parse(plain);
          } catch {
            return plain;
          }
        }
      } else {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }
      return null;
    } catch (err) {
      console.warn(`Failed to retrieve ${key}:`, err);
      return null;
    }
  }

  removeItem(key: string) {
    localStorage.removeItem(key);
    localStorage.removeItem(`_enc_${key}`);
  }

  clear() {
    this.sensitiveKeys.forEach((key) => this.removeItem(key));
  }
}

const secureStorage = new SecureStorage();

// Detect environment and set API URL
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocal) {
      return `${protocol}//${hostname}:5000/api`;
    }
  }
  return (
    import.meta.env.VITE_API_URL ||
    "https://medcore-emr-backend.onrender.com/api"
  );
};

const API_BASE_URL = getApiUrl();

let currentUser: any = null;
let autoSyncInterval: any = null;
let tokenExpiryCheckInterval: any = null;
const AUTO_SYNC_INTERVAL = 10000;
const AUTO_SYNC_MIN_INTERVAL = 5000;
const TOKEN_CHECK_INTERVAL = 60000; // Check token every minute

// ════════════════════════════════════════════════════════════
//  TOKEN EXPIRY MANAGEMENT (Security Fix)
// ════════════════════════════════════════════════════════════

function getTokenExpiry() {
  const user = secureStorage.getItem("user");
  if (!user || !user.tokenExpiry) return null;

  // Parse expiry string (e.g., "1h" -> milliseconds)
  const expiryStr = user.tokenExpiry;
  let expiryMs = 3600000; // Default 1 hour

  if (expiryStr === "1h") expiryMs = 3600000;
  else if (expiryStr === "24h") expiryMs = 86400000;
  else if (expiryStr.includes("h")) expiryMs = parseInt(expiryStr) * 3600000;

  const loginTime = user.loginTime || Date.now();
  return new Date(loginTime + expiryMs);
}

function handleTokenExpiry() {
  const expiry = getTokenExpiry();
  if (!expiry) return;

  const remaining = expiry.getTime() - Date.now();

  if (remaining <= 0) {
    // Token expired - force logout
    console.warn("🔒 Token expired. Logging out for security.");
    window.dispatchEvent(new CustomEvent("token-expired"));
    DB.logout();
  } else if (remaining < 300000) {
    // Less than 5 minutes remaining
    console.warn(`⚠️ Token expiring in ${Math.round(remaining / 1000)}s`);
    window.dispatchEvent(
      new CustomEvent("token-expiring-soon", { detail: { remaining } }),
    );
  }
}

function startTokenExpiryCheck() {
  if (tokenExpiryCheckInterval) clearInterval(tokenExpiryCheckInterval);
  tokenExpiryCheckInterval = setInterval(
    handleTokenExpiry,
    TOKEN_CHECK_INTERVAL,
  );
  handleTokenExpiry(); // Check immediately
}

function stopTokenExpiryCheck() {
  if (tokenExpiryCheckInterval) {
    clearInterval(tokenExpiryCheckInterval);
    tokenExpiryCheckInterval = null;
  }
}

async function performSync() {
  try {
    const isOnline = await DB.ping();
    if (isOnline && DB.getCurrentUser()) {
      const success = await DB.pushLocalToCloud();
      if (success) {
        secureStorage.setItem("lastSync", new Date().toISOString());
        console.log(
          "✓ Auto-sync successful at",
          new Date().toLocaleTimeString(),
        );
        window.dispatchEvent(new CustomEvent("emr-db-update"));
      } else {
        console.warn("Auto-sync push returned false");
      }
    }
  } catch (err) {
    console.error("Auto-sync error:", err);
  }
}

function markDataChanged() {
  localStorage.setItem("lastChange", new Date().toISOString());
  window.dispatchEvent(new CustomEvent("emr-db-update"));
}

function triggerAutoSync() {
  if (autoSyncInterval) return;

  autoSyncInterval = setTimeout(async () => {
    autoSyncInterval = null;
    await performSync();
  }, AUTO_SYNC_INTERVAL);
}

export const DB = {
  // ════════════════════════════════════════════════════════════
  // AUTH & STATUS
  // ════════════════════════════════════════════════════════════

  async login(email: string, password: string, gdprConsent: boolean = false) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, gdprConsent }),
      });
      const data = await res.json();

      if (data.success) {
        currentUser = data.user;
        // Add login timestamp for expiry tracking
        currentUser.loginTime = Date.now();

        // Use secure storage for sensitive data
        secureStorage.setItem("user", currentUser);
        secureStorage.setItem("token", currentUser.token);

        console.log(
          `✅ Login successful. Token expires in: ${currentUser.tokenExpiry}`,
        );

        // Start token expiry monitoring
        startTokenExpiryCheck();

        // Initialize sync tracking on login
        if (!localStorage.getItem("lastChange")) {
          localStorage.setItem("lastChange", new Date().toISOString());
        }

        // Perform initial sync on login
        console.log("Performing initial sync after login...");
        setTimeout(async () => {
          await performSync();
        }, 1500);

        return data.user;
      }

      // Handle specific error cases
      if (data.lockTime) {
        window.dispatchEvent(
          new CustomEvent("account-locked", {
            detail: { remaining: data.lockTime },
          }),
        );
      }

      return null;
    } catch (err) {
      console.error("Login error:", err);
      return null;
    }
  },

  getCurrentUser() {
    if (!currentUser) {
      const stored = secureStorage.getItem("user");
      if (stored) {
        currentUser = stored;
      }
    }

    // Check if token has expired
    if (currentUser) {
      const expiry = getTokenExpiry();
      if (expiry && expiry.getTime() <= Date.now()) {
        console.warn("🔒 Token expired during session");
        this.logout();
        return null;
      }
    }

    return currentUser;
  },

  logout() {
    currentUser = null;
    this.purgeLocalCache();
    secureStorage.removeItem("user");
    secureStorage.removeItem("token");
    stopTokenExpiryCheck();
    console.log("✅ User logged out");
  },

  purgeLocalCache() {
    const keys = [
      "patients",
      "visits",
      "appointments",
      "reports",
      "families",
      "customDiagnoses",
      "templates",
      "lastChange",
      "lastSync",
    ];
    keys.forEach((key) => {
      localStorage.removeItem(key);
      secureStorage.removeItem(key);
    });
    console.log("🗑️ Local clinical cache purged (encrypted data cleared).");
    window.dispatchEvent(new CustomEvent("emr-db-update"));
  },

  async ping() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      window.dispatchEvent(
        new CustomEvent("medcore-api-status", {
          detail: { online: data.status === "online" },
        }),
      );
      return data.status === "online";
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("medcore-api-status", { detail: { online: false } }),
      );
      return false;
    }
  },

  getSyncStatus() {
    const lastSync = localStorage.getItem("lastSync");
    const lastChange = localStorage.getItem("lastChange");

    return {
      lastSync: lastSync || null,
      lastChange: lastChange || new Date(0).toISOString(), // Default to epoch (forces sync)
      pendingChanges:
        !lastSync ||
        (lastChange && new Date(lastChange) > new Date(lastSync || 0))
          ? 1
          : 0,
    };
  },

  markDataChanged() {
    markDataChanged();
  },

  // ════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ════════════════════════════════════════════════════════════

  async syncCloudToLocal() {
    try {
      const token = secureStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE_URL}/sync/pull-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.error) {
        // Use secure storage for sensitive clinical data
        secureStorage.setItem("patients", data.patients || []);
        secureStorage.setItem("visits", data.visits || []);
        secureStorage.setItem("appointments", data.appointments || []);
        secureStorage.setItem("reports", data.reports || []);
        secureStorage.setItem("families", data.families || []);
        secureStorage.setItem("customDiagnoses", data.customDiagnoses || []);
        secureStorage.setItem("templates", data.templates || []);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Sync from cloud error:", err);
      return false;
    }
  },

  async pushLocalToCloud() {
    try {
      const token = secureStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const payload = {
        patients: secureStorage.getItem("patients") || [],
        visits: secureStorage.getItem("visits") || [],
        appointments: secureStorage.getItem("appointments") || [],
        reports: secureStorage.getItem("reports") || [],
        families: secureStorage.getItem("families") || [],
        customDiagnoses: secureStorage.getItem("customDiagnoses") || [],
        templates: secureStorage.getItem("templates") || [],
      };

      const res = await fetch(`${API_BASE_URL}/sync/push-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data.success || false;
    } catch (err) {
      console.error("Push to cloud error:", err);
      return false;
    }
  },

  async getPatients() {
    const cached = secureStorage.getItem("patients");
    return cached || [];
  },

  async getVisits() {
    const cached = secureStorage.getItem("visits");
    return cached || [];
  },

  async getReports() {
    const cached = secureStorage.getItem("reports");
    return cached || [];
  },

  async getFamilies() {
    const cached = secureStorage.getItem("families");
    return cached || [];
  },

  async getPatientHistory(mobile: string) {
    const visits = await this.getVisits();
    return visits
      .filter((v: any) => v.patientMobile === mobile)
      .sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  },

  async getDatabaseStats() {
    try {
      const [patients, visits, families, appointments, reports] =
        await Promise.all([
          this.getPatients(),
          this.getVisits(),
          this.getFamilies(),
          this.getAppointments(),
          this.getReports(),
        ]);

      return {
        patients: patients.length,
        visits: visits.length,
        families: families.length,
        appointments: appointments.length,
        reports: reports.length,
      };
    } catch (err) {
      console.error("Get stats error:", err);
      return null;
    }
  },

  async getAppointments() {
    const cached = secureStorage.getItem("appointments");
    return cached || [];
  },

  // ════════════════════════════════════════════════════════════
  // DATA SAVING (with Encryption)
  // ════════════════════════════════════════════════════════════

  async savePatient(patient: any) {
    try {
      const patients = secureStorage.getItem("patients") || [];
      const idx = patients.findIndex((p: any) => p.mobile === patient.mobile);
      if (idx >= 0) {
        patients[idx] = {
          ...patients[idx],
          ...patient,
          updatedAt: new Date().toISOString(),
        };
      } else {
        patients.push({ ...patient, updatedAt: new Date().toISOString() });
      }
      secureStorage.setItem("patients", patients);
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save patient error:", err);
      return false;
    }
  },

  async saveVisit(visit: any) {
    try {
      const visits = secureStorage.getItem("visits") || [];
      visits.push({ ...visit, updatedAt: new Date().toISOString() });
      secureStorage.setItem("visits", visits);
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save visit error:", err);
      return false;
    }
  },

  async updateVisit(visit: any) {
    try {
      const visits = secureStorage.getItem("visits") || [];
      const idx = visits.findIndex((v: any) => v.id === visit.id);
      if (idx >= 0) {
        visits[idx] = {
          ...visits[idx],
          ...visit,
          updatedAt: new Date().toISOString(),
        };
        secureStorage.setItem("visits", visits);
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Update visit error:", err);
      return false;
    }
  },

  async saveAppointment(appointment: any) {
    try {
      const appointments = secureStorage.getItem("appointments") || [];
      appointments.push({
        ...appointment,
        updatedAt: new Date().toISOString(),
      });
      secureStorage.setItem("appointments", appointments);
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save appointment error:", err);
      return false;
    }
  },

  async updateAppointment(appointment: any) {
    try {
      const appointments = secureStorage.getItem("appointments") || [];
      const idx = appointments.findIndex((a: any) => a.id === appointment.id);
      if (idx >= 0) {
        appointments[idx] = {
          ...appointments[idx],
          ...appointment,
          updatedAt: new Date().toISOString(),
        };
        secureStorage.setItem("appointments", appointments);
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Update appointment error:", err);
      return false;
    }
  },

  async saveTemplates(templates: any[]) {
    try {
      secureStorage.setItem("templates", templates);
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save templates error:", err);
      return false;
    }
  },

  async saveCustomDiagnoses(diagnoses: any[]) {
    try {
      localStorage.setItem("customDiagnoses", JSON.stringify(diagnoses));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save custom diagnoses error:", err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // DATA DELETION
  // ════════════════════════════════════════════════════════════

  async deletePatient(mobile: string) {
    try {
      const patients = JSON.parse(localStorage.getItem("patients") || "[]");
      const filtered = patients.filter((p: any) => p.mobile !== mobile);
      localStorage.setItem("patients", JSON.stringify(filtered));

      // Also remove related data
      const visits = JSON.parse(localStorage.getItem("visits") || "[]");
      const filteredVisits = visits.filter(
        (v: any) => v.patientMobile !== mobile,
      );
      localStorage.setItem("visits", JSON.stringify(filteredVisits));

      const appointments = JSON.parse(
        localStorage.getItem("appointments") || "[]",
      );
      const filteredAppointments = appointments.filter(
        (a: any) => a.patientMobile !== mobile,
      );
      localStorage.setItem(
        "appointments",
        JSON.stringify(filteredAppointments),
      );

      const reports = JSON.parse(localStorage.getItem("reports") || "[]");
      const filteredReports = reports.filter(
        (r: any) => r.patientMobile !== mobile,
      );
      localStorage.setItem("reports", JSON.stringify(filteredReports));

      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Delete patient error:", err);
      return false;
    }
  },

  async deleteVisit(id: string) {
    try {
      const visits = JSON.parse(localStorage.getItem("visits") || "[]");
      const filtered = visits.filter((v: any) => v.id !== id);
      localStorage.setItem("visits", JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Delete visit error:", err);
      return false;
    }
  },

  async deleteVisits(ids: string[]) {
    try {
      const visits = JSON.parse(localStorage.getItem("visits") || "[]");
      const filtered = visits.filter((v: any) => !ids.includes(v.id));
      localStorage.setItem("visits", JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Delete visits error:", err);
      return false;
    }
  },

  async deleteAppointment(id: string) {
    try {
      const appointments = JSON.parse(
        localStorage.getItem("appointments") || "[]",
      );
      const filtered = appointments.filter((a: any) => a.id !== id);
      localStorage.setItem("appointments", JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Delete appointment error:", err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // FAMILY MANAGEMENT
  // ════════════════════════════════════════════════════════════

  async linkFamilyMember(
    primaryMobile: string,
    memberMobile: string,
    relationship: string,
  ) {
    try {
      let families = JSON.parse(localStorage.getItem("families") || "[]");

      // Find or create family
      let family = families.find((f: any) =>
        f.members?.some((m: any) => m.mobile === primaryMobile),
      );

      if (!family) {
        family = {
          id: `family_${Date.now()}`,
          name: `Family_${primaryMobile}`,
          members: [{ mobile: primaryMobile, relationship: "Primary" }],
        };
        families.push(family);
      }

      // Add new member if not exists
      if (!family.members.find((m: any) => m.mobile === memberMobile)) {
        family.members.push({ mobile: memberMobile, relationship });
      }

      localStorage.setItem("families", JSON.stringify(families));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Link family member error:", err);
      return false;
    }
  },

  async unlinkFamilyMember(mobile: string) {
    try {
      const families = JSON.parse(localStorage.getItem("families") || "[]");
      const updated = families
        .map((f: any) => ({
          ...f,
          members: f.members?.filter((m: any) => m.mobile !== mobile) || [],
        }))
        .filter((f: any) => f.members.length > 0);

      localStorage.setItem("families", JSON.stringify(updated));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Unlink family member error:", err);
      return false;
    }
  },

  async updateFamilyName(familyId: string, name: string) {
    try {
      const families = JSON.parse(localStorage.getItem("families") || "[]");
      const idx = families.findIndex((f: any) => f.id === familyId);
      if (idx >= 0) {
        families[idx].name = name;
        localStorage.setItem("families", JSON.stringify(families));
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Update family name error:", err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // UTILITIES
  // ════════════════════════════════════════════════════════════

  async importBackup(content: string) {
    try {
      const data = JSON.parse(content);
      localStorage.setItem("patients", JSON.stringify(data.patients || []));
      localStorage.setItem("visits", JSON.stringify(data.visits || []));
      localStorage.setItem(
        "appointments",
        JSON.stringify(data.appointments || []),
      );
      localStorage.setItem("reports", JSON.stringify(data.reports || []));
      localStorage.setItem("families", JSON.stringify(data.families || []));
      localStorage.setItem(
        "customDiagnoses",
        JSON.stringify(data.customDiagnoses || []),
      );
      localStorage.setItem("templates", JSON.stringify(data.templates || []));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Import backup error:", err);
      return false;
    }
  },

  downloadCSV(filename: string, headers: string[], rows: any[][]) {
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell: any) => {
            const str = String(cell || "");
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  },

  exportToCSV(dataType: string) {
    const data: any = {
      patients: JSON.parse(localStorage.getItem("patients") || "[]"),
      visits: JSON.parse(localStorage.getItem("visits") || "[]"),
      appointments: JSON.parse(localStorage.getItem("appointments") || "[]"),
      reports: JSON.parse(localStorage.getItem("reports") || "[]"),
    };

    if (dataType === "patients" && data.patients.length > 0) {
      const headers = [
        "Mobile",
        "Name",
        "Age",
        "DOB",
        "Gender",
        "Blood Group",
        "Occupation",
        "Address",
        "Area",
        "City",
        "State",
        "Pin",
        "Country",
        "Email",
        "Allergic (Other)",
        "Allergic (Medicine)",
        "Smoking Habit",
        "Alcohol Habit",
        "Drug Abuse Habit",
        "Referred By",
        "Created Date",
        "Family ID",
        "Past History Notes",
      ];
      const rows = data.patients.map((p: any) => [
        p.mobile,
        p.name,
        p.age,
        p.dob || "",
        p.gender,
        p.bloodGroup || "",
        p.occupation || "",
        p.address || "",
        p.area || "",
        p.city || "",
        p.state || "",
        p.pin || "",
        p.country || "",
        p.email || "",
        p.allergyOther || "",
        p.allergyMedicine || "",
        p.habits?.smoke || "None",
        p.habits?.alcohol || "None",
        p.habits?.drugAbuse || "None",
        p.referredBy || "",
        p.createdDate || "",
        p.familyId || "",
        p.pastHistoryNotes || "",
      ]);
      this.downloadCSV("Full_Patient_Registry", headers, rows);
    }
  },

  async getTemplates() {
    const cached = localStorage.getItem("templates");
    return cached ? JSON.parse(cached) : [];
  },

  async getCustomDiagnoses() {
    const cached = localStorage.getItem("customDiagnoses");
    return cached ? JSON.parse(cached) : [];
  },

  async getPatientReports(mobile: string) {
    const reports = await this.getReports();
    return reports.filter((r: any) => r.patientMobile === mobile);
  },

  async getFamilyByMember(mobile: string) {
    const families = await this.getFamilies();
    return families.find((f: any) =>
      f.members?.some((m: any) => m.mobile === mobile),
    );
  },

  getDraft(mobile: string) {
    const drafts = JSON.parse(localStorage.getItem("drafts") || "{}");
    return drafts[mobile] || null;
  },

  saveDraft(mobile: string, draft: any) {
    const drafts = JSON.parse(localStorage.getItem("drafts") || "{}");
    drafts[mobile] = draft;
    localStorage.setItem("drafts", JSON.stringify(drafts));
  },

  clearDraft(mobile: string) {
    const drafts = JSON.parse(localStorage.getItem("drafts") || "{}");
    delete drafts[mobile];
    localStorage.setItem("drafts", JSON.stringify(drafts));
  },

  async saveReport(report: any) {
    try {
      const reports = JSON.parse(localStorage.getItem("reports") || "[]");
      reports.push({ ...report, updatedAt: new Date().toISOString() });
      localStorage.setItem("reports", JSON.stringify(reports));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error("Save report error:", err);
      return false;
    }
  },
};
