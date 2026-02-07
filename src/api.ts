const API_BASE = "/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DiseaseCounts {
  genes: number;
  proteins: number;
  clinvar: number;
  geo: number;
  pathways: number;
  images: number;
}

export interface Disease {
  disease_id: number;
  name: string;
  folder_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  counts: DiseaseCounts;
}

export interface Gene {
  id: number;
  gene_id: string;
  symbol: string | null;
  description: string | null;
  summary: string | null;
  status: string | null;
  synonyms: string | null;
  chromosome: string | null;
  map_location: string | null;
  organism: string | null;
}

export interface Protein {
  id: number;
  accession: string;
  definition: string | null;
  length: number | null;
  organism: string | null;
  sequence_aa: string | null;
  create_date: string | null;
  update_date: string | null;
  comments: string | null;
}

export interface ClinVarEntry {
  id: number;
  uid: string;
  title: string | null;
  clinical_significance: string | null;
  review_status: string | null;
  phenotypes: string | null;
  gene_symbols: string | null;
  variant_type: string | null;
  nucleotide_change: string | null;
  protein_change: string | null;
  molecular_consequence: string | null;
  accession: string | null;
  last_updated: string | null;
}

export interface GeoDataset {
  id: number;
  accession: string;
  title: string | null;
  summary: string | null;
  taxon: string | null;
  entry_type: string | null;
  sample_count: number | null;
  release_date: string | null;
  platform_title: string | null;
}

export interface Pathway {
  id: number;
  pathway_id: string;
  pathway_name: string;
  kegg_disease_id: string | null;
  image_url: string | null;
  pathway_page: string | null;
  created_at: string | null;
}

export interface ImageDataset {
  id: number;
  dataset_link: string;
  paper_link: string | null;
  healthy_count: number | null;
  disease_count: number | null;
  source_platform: string | null;
  created_at: string | null;
}

export interface DiseaseDetail extends Disease {
  genes?: Array<Gene>;
  proteins?: Array<Protein>;
  clinvar?: Array<ClinVarEntry>;
  geo?: Array<GeoDataset>;
  pathways?: Array<Pathway>;
  images?: Array<ImageDataset>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SearchResult {
  pagination: PaginationMeta;
  results: Array<DiseaseDetail>;
}

export interface DiseaseListResult {
  pagination: PaginationMeta;
  diseases: Array<Disease>;
}

export type EntityType = "genes" | "proteins" | "clinvar" | "geo" | "pathways" | "images";

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Search diseases by name and optionally include linked data.
 */
export function searchDiseases(
  query: string,
  include: Array<EntityType> | "all" = "all",
  page = 1,
  limit = 10,
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  if (include === "all") {
    params.append("include", "all");
  } else {
    for (const inc of include) {
      params.append("include", inc);
    }
  }
  return fetchJson<SearchResult>(`${API_BASE}/search?${params}`);
}

/**
 * Search diseases by name with only counts (no linked data) – lighter payload.
 */
export function searchDiseasesLight(
  query: string,
  page = 1,
  limit = 20,
): Promise<DiseaseListResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  return fetchJson<DiseaseListResult>(`${API_BASE}/diseases?${params}`);
}

/**
 * Get a single disease by ID with selected includes.
 */
export function getDiseaseById(
  diseaseId: number,
  include: Array<EntityType> | "all" = "all",
): Promise<DiseaseDetail> {
  const params = new URLSearchParams();
  if (include === "all") {
    params.append("include", "all");
  } else {
    for (const inc of include) {
      params.append("include", inc);
    }
  }
  return fetchJson<DiseaseDetail>(`${API_BASE}/diseases/${diseaseId}?${params}`);
}

/**
 * Get a single disease by exact name match (searches and returns the first match).
 * Falls back to partial match.
 */
export async function getDiseaseByName(
  name: string,
  include: Array<EntityType> | "all" = "all",
): Promise<DiseaseDetail | null> {
  const result = await searchDiseases(name, include === "all" ? "all" : include, 1, 50);
  // Try exact match first (case-insensitive)
  const normalized = name.toLowerCase().replace(/-/g, " ");
  const exact = result.results.find(
    (d) => d.name.toLowerCase() === normalized,
  );
  if (exact) return exact;
  return result.results[0] ?? null;
}

/**
 * Get database-wide stats.
 */
export function getStats(): Promise<DiseaseCounts & { diseases: number }> {
  return fetchJson(`${API_BASE}/stats`);
}
