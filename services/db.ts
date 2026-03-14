/**
 * Frontend Database Service
 * Provides abstraction layer for API calls to backend
 */

// Detect environment and set API URL
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  // Use environment variable for production
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

let currentUser: any = null;
let autoSyncInterval: any = null;
const AUTO_SYNC_INTERVAL = 10000; // 10 seconds - debounced sync interval
const AUTO_SYNC_MIN_INTERVAL = 5000; // Minimum 5 seconds between syncs

async function performSync() {
  try {
    const isOnline = await DB.ping();
    if (isOnline && DB.getCurrentUser()) {
      const success = await DB.pushLocalToCloud();
      if (success) {
        localStorage.setItem('lastSync', new Date().toISOString());
        console.log('✓ Auto-sync successful at', new Date().toLocaleTimeString());
        // Notify UI of sync status change
        window.dispatchEvent(new CustomEvent('emr-db-update'));
      } else {
        console.warn('Auto-sync push returned false');
      }
    }
  } catch (err) {
    console.error('Auto-sync error:', err);
  }
}

function markDataChanged() {
  localStorage.setItem('lastChange', new Date().toISOString());
  // Trigger change event
  window.dispatchEvent(new CustomEvent('emr-db-update'));
}

function triggerAutoSync() {
  if (autoSyncInterval) return; // Already scheduled
  
  autoSyncInterval = setTimeout(async () => {
    autoSyncInterval = null;
    await performSync();
  }, AUTO_SYNC_INTERVAL);
}

export const DB = {
  // ════════════════════════════════════════════════════════════
  // AUTH & STATUS
  // ════════════════════════════════════════════════════════════
  
  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('token', currentUser.token);
        
        // Initialize sync tracking on login
        if (!localStorage.getItem('lastChange')) {
          localStorage.setItem('lastChange', new Date().toISOString());
        }
        
        // Perform initial sync on login
        console.log('Performing initial sync after login...');
        setTimeout(async () => {
          await performSync();
        }, 1500);
      }
      return data.success ? data.user : null;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  },

  getCurrentUser() {
    if (!currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {
          currentUser = null;
        }
      }
    }
    return currentUser;
  },

  logout() {
    currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  async ping() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      window.dispatchEvent(new CustomEvent('medcore-api-status', { detail: { online: data.status === 'online' } }));
      return data.status === 'online';
    } catch (err) {
      window.dispatchEvent(new CustomEvent('medcore-api-status', { detail: { online: false } }));
      return false;
    }
  },

  getSyncStatus() {
    const lastSync = localStorage.getItem('lastSync');
    const lastChange = localStorage.getItem('lastChange');
    
    return {
      lastSync: lastSync || null,
      lastChange: lastChange || new Date(0).toISOString(), // Default to epoch (forces sync)
      pendingChanges: !lastSync || (lastChange && new Date(lastChange) > new Date(lastSync || 0)) ? 1 : 0
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
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE_URL}/sync/pull-all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.error) {
        localStorage.setItem('patients', JSON.stringify(data.patients || []));
        localStorage.setItem('visits', JSON.stringify(data.visits || []));
        localStorage.setItem('appointments', JSON.stringify(data.appointments || []));
        localStorage.setItem('reports', JSON.stringify(data.reports || []));
        localStorage.setItem('families', JSON.stringify(data.families || []));
        localStorage.setItem('customDiagnoses', JSON.stringify(data.customDiagnoses || []));
        localStorage.setItem('templates', JSON.stringify(data.templates || []));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Sync from cloud error:', err);
      return false;
    }
  },

  async pushLocalToCloud() {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        patients: JSON.parse(localStorage.getItem('patients') || '[]'),
        visits: JSON.parse(localStorage.getItem('visits') || '[]'),
        appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
        reports: JSON.parse(localStorage.getItem('reports') || '[]'),
        families: JSON.parse(localStorage.getItem('families') || '[]'),
        customDiagnoses: JSON.parse(localStorage.getItem('customDiagnoses') || '[]'),
        templates: JSON.parse(localStorage.getItem('templates') || '[]')
      };

      const res = await fetch(`${API_BASE_URL}/sync/push-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      return data.success || false;
    } catch (err) {
      console.error('Push to cloud error:', err);
      return false;
    }
  },

  async getPatients() {
    const cached = localStorage.getItem('patients');
    return cached ? JSON.parse(cached) : [];
  },

  async getVisits() {
    const cached = localStorage.getItem('visits');
    return cached ? JSON.parse(cached) : [];
  },

  async getReports() {
    const cached = localStorage.getItem('reports');
    return cached ? JSON.parse(cached) : [];
  },

  async getFamilies() {
    const cached = localStorage.getItem('families');
    return cached ? JSON.parse(cached) : [];
  },

  async getPatientHistory(mobile: string) {
    const visits = await this.getVisits();
    return visits.filter((v: any) => v.patientMobile === mobile).sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  },

  async getDatabaseStats() {
    try {
      const [patients, visits, families, appointments, reports] = await Promise.all([
        this.getPatients(),
        this.getVisits(),
        this.getFamilies(),
        this.getAppointments(),
        this.getReports()
      ]);

      return {
        patients: patients.length,
        visits: visits.length,
        families: families.length,
        appointments: appointments.length,
        reports: reports.length
      };
    } catch (err) {
      console.error('Get stats error:', err);
      return null;
    }
  },

  async getAppointments() {
    const cached = localStorage.getItem('appointments');
    return cached ? JSON.parse(cached) : [];
  },

  // ════════════════════════════════════════════════════════════
  // DATA SAVING
  // ════════════════════════════════════════════════════════════

  async savePatient(patient: any) {
    try {
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      const idx = patients.findIndex((p: any) => p.mobile === patient.mobile);
      if (idx >= 0) {
        patients[idx] = { ...patients[idx], ...patient, updatedAt: new Date().toISOString() };
      } else {
        patients.push({ ...patient, updatedAt: new Date().toISOString() });
      }
      localStorage.setItem('patients', JSON.stringify(patients));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save patient error:', err);
      return false;
    }
  },

  async saveVisit(visit: any) {
    try {
      const visits = JSON.parse(localStorage.getItem('visits') || '[]');
      visits.push({ ...visit, updatedAt: new Date().toISOString() });
      localStorage.setItem('visits', JSON.stringify(visits));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save visit error:', err);
      return false;
    }
  },

  async updateVisit(visit: any) {
    try {
      const visits = JSON.parse(localStorage.getItem('visits') || '[]');
      const idx = visits.findIndex((v: any) => v.id === visit.id);
      if (idx >= 0) {
        visits[idx] = { ...visits[idx], ...visit, updatedAt: new Date().toISOString() };
        localStorage.setItem('visits', JSON.stringify(visits));
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update visit error:', err);
      return false;
    }
  },

  async saveAppointment(appointment: any) {
    try {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      appointments.push({ ...appointment, updatedAt: new Date().toISOString() });
      localStorage.setItem('appointments', JSON.stringify(appointments));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save appointment error:', err);
      return false;
    }
  },

  async updateAppointment(appointment: any) {
    try {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const idx = appointments.findIndex((a: any) => a.id === appointment.id);
      if (idx >= 0) {
        appointments[idx] = { ...appointments[idx], ...appointment, updatedAt: new Date().toISOString() };
        localStorage.setItem('appointments', JSON.stringify(appointments));
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update appointment error:', err);
      return false;
    }
  },

  async saveTemplates(templates: any[]) {
    try {
      localStorage.setItem('templates', JSON.stringify(templates));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save templates error:', err);
      return false;
    }
  },

  async saveCustomDiagnoses(diagnoses: any[]) {
    try {
      localStorage.setItem('customDiagnoses', JSON.stringify(diagnoses));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save custom diagnoses error:', err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // DATA DELETION
  // ════════════════════════════════════════════════════════════

  async deletePatient(mobile: string) {
    try {
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      const filtered = patients.filter((p: any) => p.mobile !== mobile);
      localStorage.setItem('patients', JSON.stringify(filtered));

      // Also remove related data
      const visits = JSON.parse(localStorage.getItem('visits') || '[]');
      const filteredVisits = visits.filter((v: any) => v.patientMobile !== mobile);
      localStorage.setItem('visits', JSON.stringify(filteredVisits));

      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const filteredAppointments = appointments.filter((a: any) => a.patientMobile !== mobile);
      localStorage.setItem('appointments', JSON.stringify(filteredAppointments));

      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      const filteredReports = reports.filter((r: any) => r.patientMobile !== mobile);
      localStorage.setItem('reports', JSON.stringify(filteredReports));

      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Delete patient error:', err);
      return false;
    }
  },

  async deleteVisit(id: string) {
    try {
      const visits = JSON.parse(localStorage.getItem('visits') || '[]');
      const filtered = visits.filter((v: any) => v.id !== id);
      localStorage.setItem('visits', JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Delete visit error:', err);
      return false;
    }
  },

  async deleteVisits(ids: string[]) {
    try {
      const visits = JSON.parse(localStorage.getItem('visits') || '[]');
      const filtered = visits.filter((v: any) => !ids.includes(v.id));
      localStorage.setItem('visits', JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Delete visits error:', err);
      return false;
    }
  },

  async deleteAppointment(id: string) {
    try {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const filtered = appointments.filter((a: any) => a.id !== id);
      localStorage.setItem('appointments', JSON.stringify(filtered));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Delete appointment error:', err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // FAMILY MANAGEMENT
  // ════════════════════════════════════════════════════════════

  async linkFamilyMember(primaryMobile: string, memberMobile: string, relationship: string) {
    try {
      let families = JSON.parse(localStorage.getItem('families') || '[]');
      
      // Find or create family
      let family = families.find((f: any) => f.members?.some((m: any) => m.mobile === primaryMobile));
      
      if (!family) {
        family = {
          id: `family_${Date.now()}`,
          name: `Family_${primaryMobile}`,
          members: [{ mobile: primaryMobile, relationship: 'Primary' }]
        };
        families.push(family);
      }

      // Add new member if not exists
      if (!family.members.find((m: any) => m.mobile === memberMobile)) {
        family.members.push({ mobile: memberMobile, relationship });
      }

      localStorage.setItem('families', JSON.stringify(families));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Link family member error:', err);
      return false;
    }
  },

  async unlinkFamilyMember(mobile: string) {
    try {
      const families = JSON.parse(localStorage.getItem('families') || '[]');
      const updated = families.map((f: any) => ({
        ...f,
        members: f.members?.filter((m: any) => m.mobile !== mobile) || []
      })).filter((f: any) => f.members.length > 0);
      
      localStorage.setItem('families', JSON.stringify(updated));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Unlink family member error:', err);
      return false;
    }
  },

  async updateFamilyName(familyId: string, name: string) {
    try {
      const families = JSON.parse(localStorage.getItem('families') || '[]');
      const idx = families.findIndex((f: any) => f.id === familyId);
      if (idx >= 0) {
        families[idx].name = name;
        localStorage.setItem('families', JSON.stringify(families));
        markDataChanged();
        triggerAutoSync();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update family name error:', err);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════
  // UTILITIES
  // ════════════════════════════════════════════════════════════

  async importBackup(content: string) {
    try {
      const data = JSON.parse(content);
      localStorage.setItem('patients', JSON.stringify(data.patients || []));
      localStorage.setItem('visits', JSON.stringify(data.visits || []));
      localStorage.setItem('appointments', JSON.stringify(data.appointments || []));
      localStorage.setItem('reports', JSON.stringify(data.reports || []));
      localStorage.setItem('families', JSON.stringify(data.families || []));
      localStorage.setItem('customDiagnoses', JSON.stringify(data.customDiagnoses || []));
      localStorage.setItem('templates', JSON.stringify(data.templates || []));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Import backup error:', err);
      return false;
    }
  },

  downloadCSV(filename: string, headers: string[], rows: any[][]) {
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => {
        const str = String(cell || '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  },

  exportToCSV(dataType: string) {
    const data: any = {
      patients: JSON.parse(localStorage.getItem('patients') || '[]'),
      visits: JSON.parse(localStorage.getItem('visits') || '[]'),
      appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
      reports: JSON.parse(localStorage.getItem('reports') || '[]')
    };

    if (dataType === 'patients' && data.patients.length > 0) {
      const headers = ['Mobile', 'Name', 'Age', 'Gender', 'Blood Group', 'City'];
      const rows = data.patients.map((p: any) => [p.mobile, p.name, p.age, p.gender, p.bloodGroup, p.city]);
      this.downloadCSV('Patients_Export', headers, rows);
    }
  },

  async getTemplates() {
    const cached = localStorage.getItem('templates');
    return cached ? JSON.parse(cached) : [];
  },

  async getCustomDiagnoses() {
    const cached = localStorage.getItem('customDiagnoses');
    return cached ? JSON.parse(cached) : [];
  },

  async getPatientReports(mobile: string) {
    const reports = await this.getReports();
    return reports.filter((r: any) => r.patientMobile === mobile);
  },

  async getFamilyByMember(mobile: string) {
    const families = await this.getFamilies();
    return families.find((f: any) => f.members?.some((m: any) => m.mobile === mobile));
  },

  getDraft(mobile: string) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
    return drafts[mobile] || null;
  },

  saveDraft(mobile: string, draft: any) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
    drafts[mobile] = draft;
    localStorage.setItem('drafts', JSON.stringify(drafts));
  },

  clearDraft(mobile: string) {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
    delete drafts[mobile];
    localStorage.setItem('drafts', JSON.stringify(drafts));
  },

  async saveReport(report: any) {
    try {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      reports.push({ ...report, updatedAt: new Date().toISOString() });
      localStorage.setItem('reports', JSON.stringify(reports));
      markDataChanged();
      triggerAutoSync();
      return true;
    } catch (err) {
      console.error('Save report error:', err);
      return false;
    }
  }
};
