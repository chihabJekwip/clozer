// Import de fichiers Excel pour les clients
import * as XLSX from 'xlsx';
import { Client } from '@/types';
import { generateId } from './utils';

interface ExcelRow {
  [key: string]: string | number | undefined;
}

// Mapping des colonnes Excel vers les champs Client
const COLUMN_MAPPING: Record<string, keyof Client> = {
  'civilite': 'civilite',
  'civilité': 'civilite',
  'nom': 'nom',
  'prenom': 'prenom',
  'prénom': 'prenom',
  'domicile': 'telDomicile',
  'tel domicile': 'telDomicile',
  'téléphone domicile': 'telDomicile',
  'portable m.': 'portableM',
  'portable m': 'portableM',
  'portable monsieur': 'portableM',
  'portable mme': 'portableMme',
  'portable mme.': 'portableMme',
  'portable madame': 'portableMme',
  'adresse': 'adresse',
  'adresse (corresp.)': 'adresse',
  'adresse (corresp)': 'adresse',
  'cp': 'codePostal',
  'cp (corresp.)': 'codePostal',
  'cp (corresp)': 'codePostal',
  'code postal': 'codePostal',
  'ville': 'ville',
  'ville (corresp.)': 'ville',
  'ville (corresp)': 'ville',
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim();
}

function findColumnMapping(headers: string[]): Map<number, keyof Client> {
  const mapping = new Map<number, keyof Client>();
  
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    const clientField = COLUMN_MAPPING[normalized];
    if (clientField) {
      mapping.set(index, clientField);
    }
  });
  
  return mapping;
}

function cleanValue(value: string | number | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim();
}

export function parseExcelFile(file: ArrayBuffer): {
  clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[];
  errors: string[];
} {
  const errors: string[] = [];
  const clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  try {
    const workbook = XLSX.read(file, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      errors.push('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
      return { clients, errors };
    }

    // Trouver la ligne d'en-tête (chercher une ligne avec "Civilité" ou "Nom")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i] as unknown as (string | number)[];
      if (row && Array.isArray(row) && row.some(cell => {
        const cellStr = String(cell || '').toLowerCase();
        return cellStr.includes('civilit') || cellStr.includes('nom') || cellStr.includes('prenom');
      })) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      errors.push('Impossible de trouver la ligne d\'en-tête');
      return { clients, errors };
    }

    const headers = (jsonData[headerRowIndex] as unknown as string[]).map(h => String(h || ''));
    const columnMapping = findColumnMapping(headers);

    if (columnMapping.size === 0) {
      errors.push('Aucune colonne reconnue dans le fichier');
      return { clients, errors };
    }

    // Parser les données
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown as (string | number)[];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      // Vérifier si la ligne n'est pas vide
      const hasData = row.some(cell => cell !== undefined && cell !== null && cell !== '');
      if (!hasData) continue;

      const client: Partial<Client> = {
        civilite: '',
        nom: '',
        prenom: '',
        telDomicile: null,
        portableM: null,
        portableMme: null,
        adresse: '',
        codePostal: '',
        ville: '',
        latitude: null,
        longitude: null,
        assignedTo: null,
      };

      columnMapping.forEach((field, colIndex) => {
        const value = cleanValue(row[colIndex]);
        if (value !== null) {
          (client as Record<string, string | number | null>)[field] = value;
        }
      });

      // Vérifier les champs obligatoires
      if (!client.nom || !client.adresse || !client.codePostal || !client.ville) {
        errors.push(`Ligne ${i + 1}: données incomplètes (nom, adresse, code postal ou ville manquant)`);
        continue;
      }

      clients.push(client as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    }

    if (clients.length === 0) {
      errors.push('Aucun client valide trouvé dans le fichier');
    }

  } catch (error) {
    errors.push(`Erreur lors de la lecture du fichier: ${error}`);
  }

  return { clients, errors };
}

// Lire un fichier depuis un input HTML
export function readExcelFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as ArrayBuffer);
      } else {
        reject(new Error('Erreur de lecture du fichier'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

// Export des clients vers Excel
export function exportClientsToExcel(clients: Client[]): Blob {
  const data = clients.map(c => ({
    'Civilité': c.civilite,
    'Nom': c.nom,
    'Prénom': c.prenom,
    'Tél. Domicile': c.telDomicile || '',
    'Portable M.': c.portableM || '',
    'Portable Mme': c.portableMme || '',
    'Adresse': c.adresse,
    'Code Postal': c.codePostal,
    'Ville': c.ville,
    'Latitude': c.latitude || '',
    'Longitude': c.longitude || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
