import moment from 'moment'

export interface Individual {
  id: string
  name: {
    fullName: string
    given?: string
    surname?: string
  }
  sex?: 'M' | 'F'
  birth?: {
    date?: string
    place?: string
  }
  death?: {
    date?: string
    place?: string
  }
  burial?: {
    date?: string
    place?: string
  }
  age?: number
  alive?: boolean
  families?: string[]
  parents?: string[]
  spouse?: string[]
  children?: string[]
}

export interface Family {
  id: string
  husband?: string
  wife?: string
  children: string[]
  marriage?: {
    date?: string
    place?: string
  }
}

export interface ParsedGedcomData {
  individuals: Individual[]
  families: Family[]
}

function extractName(nameStr: string): { fullName: string; given?: string; surname?: string } {
  if (!nameStr) return { fullName: 'Unknown' }
  
  // Parse GEDCOM name format: "Given /Surname/"
  const match = nameStr.match(/^([^/]*)\s*\/([^/]*)\//);
  if (match) {
    const given = match[1]?.trim()
    const surname = match[2]?.trim()
    return {
      fullName: `${given} ${surname}`.trim(),
      given,
      surname
    }
  }
  return { fullName: nameStr.trim() }
}

function formatDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  
  // Try to parse and format the date
  const parsed = moment(dateStr, [
    'D MMM YYYY',
    'MMM YYYY', 
    'YYYY',
    'D MMM',
    'MMM D, YYYY'
  ], true)
  
  if (parsed.isValid()) {
    return parsed.format('MMM DD, YYYY')
  }
  return dateStr
}

function calculateAge(birthDate?: string, deathDate?: string): number | undefined {
  if (!birthDate) return undefined
  
  const birth = moment(birthDate, [
    'D MMM YYYY',
    'MMM YYYY', 
    'YYYY',
    'D MMM',
    'MMM D, YYYY',
    'MMM DD, YYYY'
  ], true)
  
  if (!birth.isValid()) return undefined
  
  const endDate = deathDate 
    ? moment(deathDate, [
        'D MMM YYYY',
        'MMM YYYY', 
        'YYYY',
        'D MMM',
        'MMM D, YYYY',
        'MMM DD, YYYY'
      ], true)
    : moment()
  
  if (!endDate.isValid()) return undefined
  
  return endDate.diff(birth, 'years')
}

// Simple GEDCOM parser that's more resilient to formatting issues
export function parseGedcomFile(gedcomContent: string): ParsedGedcomData {
  try {
    if (!gedcomContent || typeof gedcomContent !== 'string') {
      console.error('Invalid GEDCOM content');
      return { individuals: [], families: [] };
    }

    // Clean up line endings and split into lines
    const lines = gedcomContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n');
    
    const individuals: Individual[] = [];
    const families: Family[] = [];
    
    let currentRecord: any = null;
    let currentLevel = -1;
    let currentTag = '';
    let currentEvent: any = null;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // GEDCOM format: level [pointer] tag [value]
      // Example: "0 @I1@ INDI" or "1 NAME John /Smith/"
      const match = line.match(/^(\d+)\s+(?:(@\w+@)\s+)?(\w+)(?:\s+(.*))?$/);
      if (!match) {
        console.warn('Could not parse line:', line);
        continue;
      }
      
      const level = parseInt(match[1], 10);
      const pointer = match[2] || '';
      const tag = match[3];
      const value = match[4] ? match[4].trim() : '';
      
      // Handle level 0 - new record
      if (level === 0) {
        currentLevel = 0;
        currentEvent = null;
        
        if (tag === 'INDI') {
          // Individual record with ID in pointer
          const id = pointer.replace(/@/g, '');
          currentRecord = {
            id,
            name: { fullName: 'Unknown' }
          };
          individuals.push(currentRecord);
          currentTag = tag;
        }
        else if (pointer && value === 'INDI') {
          // Alternative format: 0 @I1@ INDI
          const id = pointer.replace(/@/g, '');
          currentRecord = {
            id,
            name: { fullName: 'Unknown' }
          };
          individuals.push(currentRecord);
          currentTag = value;
        }
        else if (tag === 'FAM') {
          // Family record with ID in pointer
          const id = pointer.replace(/@/g, '');
          currentRecord = {
            id,
            children: []
          };
          families.push(currentRecord);
          currentTag = tag;
        }
        else if (pointer && value === 'FAM') {
          // Alternative format: 0 @F1@ FAM
          const id = pointer.replace(/@/g, '');
          currentRecord = {
            id,
            children: []
          };
          families.push(currentRecord);
          currentTag = value;
        }
        else {
          currentRecord = null;
          currentTag = '';
        }
      }
      // Handle nested levels
      else if (currentRecord) {
        // Individual record processing
        if (currentTag === 'INDI') {
          if (level === 1) {
            currentEvent = null;
            
            switch (tag) {
              case 'NAME':
                currentRecord.name = extractName(value);
                break;
              case 'SEX':
                currentRecord.sex = value;
                break;
              case 'BIRT':
                currentRecord.birth = {};
                currentEvent = 'birth';
                break;
              case 'DEAT':
                currentRecord.death = {};
                currentEvent = 'death';
                break;
              case 'BURI':
                currentRecord.burial = {};
                currentEvent = 'burial';
                break;
              case 'FAMC':
                // Extract family reference ID
                const familyRef = value.match(/@([^@]+)@/) || pointer.match(/@([^@]+)@/);
                if (familyRef) {
                  currentRecord.parents = currentRecord.parents || [];
                  currentRecord.parents.push(familyRef[1]);
                }
                break;
              case 'FAMS':
                // Extract spouse family reference ID
                const spouseRef = value.match(/@([^@]+)@/) || pointer.match(/@([^@]+)@/);
                if (spouseRef) {
                  currentRecord.families = currentRecord.families || [];
                  currentRecord.families.push(spouseRef[1]);
                }
                break;
            }
          } else if (level === 2 && currentEvent) {
            switch (tag) {
              case 'DATE':
                currentRecord[currentEvent].date = formatDate(value);
                break;
              case 'PLAC':
                currentRecord[currentEvent].place = value;
                break;
            }
          }
        }
        // Family record processing
        else if (currentTag === 'FAM') {
          if (level === 1) {
            currentEvent = null;
            
            switch (tag) {
              case 'HUSB':
                // Extract husband reference ID
                const husbRef = value.match(/@([^@]+)@/) || pointer.match(/@([^@]+)@/);
                if (husbRef) {
                  currentRecord.husband = husbRef[1];
                }
                break;
              case 'WIFE':
                // Extract wife reference ID
                const wifeRef = value.match(/@([^@]+)@/) || pointer.match(/@([^@]+)@/);
                if (wifeRef) {
                  currentRecord.wife = wifeRef[1];
                }
                break;
              case 'CHIL':
                // Extract child reference ID
                const childRef = value.match(/@([^@]+)@/) || pointer.match(/@([^@]+)@/);
                if (childRef) {
                  currentRecord.children.push(childRef[1]);
                }
                break;
              case 'MARR':
                currentRecord.marriage = {};
                currentEvent = 'marriage';
                break;
            }
          } else if (level === 2 && currentEvent) {
            switch (tag) {
              case 'DATE':
                currentRecord[currentEvent].date = formatDate(value);
                break;
              case 'PLAC':
                currentRecord[currentEvent].place = value;
                break;
            }
          }
        }
      }
    }
    
    // Calculate age and alive status for individuals
    individuals.forEach(individual => {
      individual.age = calculateAge(individual.birth?.date, individual.death?.date);
      individual.alive = !individual.death?.date;
    });
    
    // Add spouse and children relationships
    for (const family of families) {
      if (family.husband) {
        const husband = individuals.find(i => i.id === family.husband);
        if (husband) {
          husband.spouse = husband.spouse || [];
          if (family.wife && !husband.spouse.includes(family.wife)) {
            husband.spouse.push(family.wife);
          }
          husband.children = husband.children || [];
          for (const childId of family.children) {
            if (!husband.children.includes(childId)) {
              husband.children.push(childId);
            }
          }
        }
      }
      
      if (family.wife) {
        const wife = individuals.find(i => i.id === family.wife);
        if (wife) {
          wife.spouse = wife.spouse || [];
          if (family.husband && !wife.spouse.includes(family.husband)) {
            wife.spouse.push(family.husband);
          }
          wife.children = wife.children || [];
          for (const childId of family.children) {
            if (!wife.children.includes(childId)) {
              wife.children.push(childId);
            }
          }
        }
      }
    }
    
    console.log(`Parsed ${individuals.length} individuals and ${families.length} families`);
    return { individuals, families };
  } catch (error) {
    console.error('Error in parseGedcomFile:', error);
    return { individuals: [], families: [] };
  }
} 