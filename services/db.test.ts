
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DB } from './db';

describe('DB Service (Frontend)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Auth Logic', () => {
    it('should handle logout correctly', () => {
      localStorage.setItem('user', JSON.stringify({ name: 'Dr. Smith' }));
      localStorage.setItem('token', 'fake-token');
      
      DB.logout();
      
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(DB.getCurrentUser()).toBeNull();
    });

    it('should retrieve current user from cache', () => {
      const user = { name: 'Dr. Smith', email: 'smith@medcore.in' };
      localStorage.setItem('user', JSON.stringify(user));
      
      const current = DB.getCurrentUser();
      expect(current).toEqual(user);
    });
  });

  describe('Patient CRUD', () => {
    it('should save a new patient and update lastChange', () => {
      const patient = { mobile: '9876543210', name: 'John Doe' };
      DB.savePatient(patient);
      
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      expect(patients).toHaveLength(1);
      expect(patients[0].name).toBe('John Doe');
      expect(localStorage.getItem('lastChange')).toBeDefined();
    });

    it('should update existing patient if mobile matches', () => {
      const p1 = { mobile: '123', name: 'Original' };
      const p2 = { mobile: '123', name: 'Updated' };
      
      DB.savePatient(p1);
      DB.savePatient(p2);
      
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      expect(patients).toHaveLength(1);
      expect(patients[0].name).toBe('Updated');
    });

    it('should perform cascading delete', async () => {
      // Setup patient + visit + appointment
      const mobile = '555';
      DB.savePatient({ mobile, name: 'Deletable' });
      DB.saveVisit({ id: 'v1', patientMobile: mobile, diagnosis: 'Flu' });
      DB.saveAppointment({ id: 'a1', patientMobile: mobile, date: '2024-01-01' });
      
      // Verify they exist
      expect(await DB.getPatients()).toHaveLength(1);
      expect(await DB.getVisits()).toHaveLength(1);
      expect(await DB.getAppointments()).toHaveLength(1);
      
      // Delete
      await DB.deletePatient(mobile);
      
      // Verify cascading delete
      expect(await DB.getPatients()).toHaveLength(0);
      expect(await DB.getVisits()).toHaveLength(0);
      expect(await DB.getAppointments()).toHaveLength(0);
    });
  });

  describe('Sync Status Logic', () => {
    it('should report pending changes if lastChange > lastSync', () => {
      localStorage.setItem('lastChange', '2024-01-02T10:00:00.000Z');
      localStorage.setItem('lastSync', '2024-01-02T09:00:00.000Z');
      
      const status = DB.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
    });

    it('should report NO pending changes if lastSync > lastChange', () => {
      localStorage.setItem('lastChange', '2024-01-02T08:00:00.000Z');
      localStorage.setItem('lastSync', '2024-01-02T09:00:00.000Z');
      
      const status = DB.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });
  });
});
