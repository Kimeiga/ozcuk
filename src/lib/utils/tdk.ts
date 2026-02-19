/**
 * TDK (Türk Dil Kurumu) API Service
 * Fetches native Turkish definitions from the official Turkish Language Association
 */

export interface TdkDefinition {
  anlam_sira: string;
  anlam: string;
  ornekler?: TdkExample[];
  ozellikler?: string[];
}

export interface TdkExample {
  ornek: string;
  yazar?: string;
}

export interface TdkEntry {
  madde: string;
  telaffuz?: string;
  taki?: string;
  anlamlar: TdkDefinition[];
  birlesikler?: string[];
  atasozleri?: string[];
}

export interface TdkResponse {
  found: boolean;
  entry?: TdkEntry;
  error?: string;
}

const TDK_API_URL = 'https://sozluk.gov.tr/gts';

/**
 * Fetch word definition from TDK API
 */
export async function fetchTdkDefinition(word: string): Promise<TdkResponse> {
  try {
    const response = await fetch(`${TDK_API_URL}?ara=${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      return { found: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    // TDK returns an array, check if it's an error response
    if (!Array.isArray(data) || data.length === 0) {
      return { found: false };
    }
    
    // Check for error response format (TDK may return {error: "..."} for some queries)
    if ('error' in data && typeof data.error === 'string') {
      return { found: false, error: data.error };
    }
    
    const entry = data[0];
    
    // Parse the TDK response into our format
    const anlamlar: TdkDefinition[] = (entry.anlamlarListe || []).map((a: Record<string, unknown>) => ({
      anlam_sira: a.anlam_sira as string,
      anlam: cleanDefinition(a.anlam as string),
      ornekler: (a.orneklerListe as Record<string, unknown>[] || []).map((o: Record<string, unknown>) => ({
        ornek: o.ornek as string,
        yazar: getYazarName(o.yazar as Record<string, unknown>[] | undefined)
      })),
      ozellikler: (a.ozelliklerListe as Record<string, unknown>[] || []).map((oz: Record<string, unknown>) => oz.kisa_adi as string)
    }));
    
    // Parse atasözleri (idioms/proverbs)
    const atasozleri = (entry.atasozu || []).map((a: Record<string, unknown>) => a.madde as string);
    
    // Parse birleşik kelimeler (compound words)
    const birlesikler = entry.birlesikler?.split(', ') || [];
    
    return {
      found: true,
      entry: {
        madde: entry.madde,
        telaffuz: entry.telaffuz || undefined,
        taki: entry.taki || undefined,
        anlamlar,
        birlesikler: birlesikler.length > 0 ? birlesikler : undefined,
        atasozleri: atasozleri.length > 0 ? atasozleri : undefined
      }
    };
  } catch (error) {
    console.error('TDK API error:', error);
    return { found: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clean up definition text (remove HTML, fix arrows)
 */
function cleanDefinition(text: string): string {
  if (!text) return '';
  // Remove HTML tags
  let clean = text.replace(/<[^>]*>/g, '');
  // Replace arrow symbol
  clean = clean.replace(/►/g, '→');
  return clean.trim();
}

/**
 * Get author name from TDK yazar array
 */
function getYazarName(yazar: Record<string, unknown>[] | undefined): string | undefined {
  if (!yazar || yazar.length === 0) return undefined;
  return yazar[0].kisa_adi as string;
}

