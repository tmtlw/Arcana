// src/services/UpdateService.ts

export interface UpdateResponse {
  status: 'success' | 'error';
  message: string;
  has_update?: boolean;
  local_sha?: string;
  remote_sha?: string;
  backup_id?: string;
  backups?: string[];
}

// Abszolút útvonal a gyökérben lévő PHP fájlhoz (javítva relatívra a subdirectory támogatás miatt)
const UPDATER_URL = './updater.php';
// A titkos kulcsot itt tároljuk. Élesben ezt környezeti változóból vagy config fájlból kéne olvasni.
// Mivel ez kliens oldali kód, a felhasználó láthatja, de ez csak egy egyszerű védelem a véletlen/bot kérések ellen.
const SECRET_KEY = 'tarot_secret_updater_key';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'X-Updater-Secret': SECRET_KEY
    };
};

export const UpdateService = {
  /**
   * Ellenőrzi, van-e elérhető frissítés.
   */
  async checkForUpdates(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=check&secret=${SECRET_KEY}`, {
          method: 'GET',
          headers: getHeaders()
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Update check failed:", error);
      return { status: 'error', message: 'Nem sikerült ellenőrizni a frissítéseket.' };
    }
  },

  /**
   * Elindítja a frissítési folyamatot.
   */
  async performUpdate(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=update&secret=${SECRET_KEY}`, {
          method: 'POST', // POST a módosításhoz
          headers: getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Update failed:", error);
      return { status: 'error', message: 'A frissítés sikertelen volt.' };
    }
  },

  /**
   * Lekéri a korábbi biztonsági mentéseket.
   */
  async listBackups(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=list_backups&secret=${SECRET_KEY}`, {
          headers: getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      return { status: 'error', message: 'Nem sikerült lekérni a mentéseket.' };
    }
  },

  /**
   * Visszaállít egy korábbi mentést.
   */
  async restoreBackup(backupId: string): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=restore&id=${backupId}&secret=${SECRET_KEY}`, {
          method: 'POST',
          headers: getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      return { status: 'error', message: 'A visszaállítás sikertelen volt.' };
    }
  }
};
