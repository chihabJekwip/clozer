// Import de fichiers Excel pour les clients
import * as XLSX from 'xlsx';
import { Client, User } from '@/types';
import { generateId } from './utils';

interface ExcelRow {
  [key: string]: string | number | undefined;
}

// Extended client type with commercial name from import
export interface ImportedClient extends Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
  commercialName?: string; // Name from Excel file
}

export interface ImportResult {
  clients: ImportedClient[];
  errors: string[];
  hasCommercialColumn: boolean;
  unmatchedCommercials: string[]; // Commercial names that couldn't be matched to users
}

// Mapping des colonnes Excel vers les champs Client
const COLUMN_MAPPING: Record<string, keyof Client | 'commercial'> = {
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
  // Commercial assignment columns
  'commercial': 'commercial',
  'commerciale': 'commercial',
  'assigné à': 'commercial',
  'assigne a': 'commercial',
  'assigned to': 'commercial',
  'vendeur': 'commercial',
  'responsable': 'commercial',
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim();
}

interface ColumnMappingResult {
  mapping: Map<number, keyof Client | 'commercial'>;
  hasCommercialColumn: boolean;
  commercialColumnIndex: number | null;
}

function findColumnMapping(headers: string[]): ColumnMappingResult {
  const mapping = new Map<number, keyof Client | 'commercial'>();
  let hasCommercialColumn = false;
  let commercialColumnIndex: number | null = null;
  
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    const field = COLUMN_MAPPING[normalized];
    if (field) {
      mapping.set(index, field);
      if (field === 'commercial') {
        hasCommercialColumn = true;
        commercialColumnIndex = index;
      }
    }
  });
  
  return { mapping, hasCommercialColumn, commercialColumnIndex };
}

function cleanValue(value: string | number | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim();
}

export function parseExcelFile(file: ArrayBuffer): ImportResult {
  const errors: string[] = [];
  const clients: ImportedClient[] = [];
  const unmatchedCommercials = new Set<string>();
  let hasCommercialColumn = false;

  try {
    const workbook = XLSX.read(file, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      errors.push('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
      return { clients, errors, hasCommercialColumn: false, unmatchedCommercials: [] };
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
      return { clients, errors, hasCommercialColumn: false, unmatchedCommercials: [] };
    }

    const headers = (jsonData[headerRowIndex] as unknown as string[]).map(h => String(h || ''));
    const mappingResult = findColumnMapping(headers);
    const columnMapping = mappingResult.mapping;
    hasCommercialColumn = mappingResult.hasCommercialColumn;

    if (columnMapping.size === 0) {
      errors.push('Aucune colonne reconnue dans le fichier');
      return { clients, errors, hasCommercialColumn: false, unmatchedCommercials: [] };
    }

    // Parser les données
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown as (string | number)[];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      // Vérifier si la ligne n'est pas vide
      const hasData = row.some(cell => cell !== undefined && cell !== null && cell !== '');
      if (!hasData) continue;

      const client: Partial<ImportedClient> = {
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
        commercialName: undefined,
      };

      columnMapping.forEach((field, colIndex) => {
        const value = cleanValue(row[colIndex]);
        if (value !== null) {
          if (field === 'commercial') {
            client.commercialName = value;
          } else {
            (client as Record<string, string | number | null>)[field] = value;
          }
        }
      });

      // Track commercial names for later matching
      if (client.commercialName) {
        unmatchedCommercials.add(client.commercialName);
      }

      // Vérifier les champs obligatoires
      if (!client.nom || !client.adresse || !client.codePostal || !client.ville) {
        errors.push(`Ligne ${i + 1}: données incomplètes (nom, adresse, code postal ou ville manquant)`);
        continue;
      }

      clients.push(client as ImportedClient);
    }

    if (clients.length === 0) {
      errors.push('Aucun client valide trouvé dans le fichier');
    }

  } catch (error) {
    errors.push(`Erreur lors de la lecture du fichier: ${error}`);
  }

  return { 
    clients, 
    errors, 
    hasCommercialColumn, 
    unmatchedCommercials: Array.from(unmatchedCommercials) 
  };
}

// Match commercial names to user IDs
export function matchCommercialsToUsers(
  clients: ImportedClient[], 
  users: User[]
): {
  matchedClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[];
  unmatchedCommercials: string[];
  clientsWithoutCommercial: number;
} {
  const unmatchedSet = new Set<string>();
  let clientsWithoutCommercial = 0;

  // Create a map of user names (normalized) to user IDs
  const userNameMap = new Map<string, string>();
  users.forEach(user => {
    // Match by full name (case insensitive)
    userNameMap.set(user.name.toLowerCase().trim(), user.id);
    // Also try first name only
    const firstName = user.name.split(' ')[0].toLowerCase().trim();
    if (!userNameMap.has(firstName)) {
      userNameMap.set(firstName, user.id);
    }
  });

  const matchedClients = clients.map(client => {
    const { commercialName, ...clientData } = client;
    
    if (commercialName) {
      const normalizedName = commercialName.toLowerCase().trim();
      const userId = userNameMap.get(normalizedName);
      
      if (userId) {
        return { ...clientData, assignedTo: userId };
      } else {
        unmatchedSet.add(commercialName);
        return { ...clientData, assignedTo: null };
      }
    } else {
      clientsWithoutCommercial++;
      return { ...clientData, assignedTo: null };
    }
  });

  return {
    matchedClients,
    unmatchedCommercials: Array.from(unmatchedSet),
    clientsWithoutCommercial,
  };
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
