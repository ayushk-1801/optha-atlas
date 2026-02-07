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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Paginated wrapper returned for each linked entity */
export interface PaginatedEntity<T> {
  data: Array<T>;
  pagination: PaginationMeta;
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

/** Disease detail — each linked entity is now a paginated wrapper */
export interface DiseaseDetail extends Disease {
  genes?: PaginatedEntity<Gene>;
  proteins?: PaginatedEntity<Protein>;
  clinvar?: PaginatedEntity<ClinVarEntry>;
  geo?: PaginatedEntity<GeoDataset>;
  pathways?: PaginatedEntity<Pathway>;
  images?: PaginatedEntity<ImageDataset>;
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
 * Supports per-entity pagination via entityPagination.
 */
export function searchDiseases(
  query: string,
  include: Array<EntityType> | "all" = "all",
  page = 1,
  limit = 10,
  entityPagination?: Partial<Record<EntityType, { page: number; limit: number }>>,
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
  if (entityPagination) {
    for (const [key, val] of Object.entries(entityPagination)) {
      params.set(`${key}_page`, String(val.page));
      params.set(`${key}_limit`, String(val.limit));
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
 * Get a single disease by ID with selected includes and per-entity pagination.
 */
export function getDiseaseById(
  diseaseId: number,
  include: Array<EntityType> | "all" = "all",
  entityPagination?: Partial<Record<EntityType, { page: number; limit: number }>>,
): Promise<DiseaseDetail> {
  const params = new URLSearchParams();
  if (include === "all") {
    params.append("include", "all");
  } else {
    for (const inc of include) {
      params.append("include", inc);
    }
  }
  if (entityPagination) {
    for (const [key, val] of Object.entries(entityPagination)) {
      params.set(`${key}_page`, String(val.page));
      params.set(`${key}_limit`, String(val.limit));
    }
  }
  return fetchJson<DiseaseDetail>(`${API_BASE}/diseases/${diseaseId}?${params}`);
}

/**
 * Get a single disease by exact name match.
 * Only fetches counts (no includes) for the overview page.
 */
export async function getDiseaseByName(
  name: string,
): Promise<Disease | null> {
  const searchName = name.replace(/-/g, " ");
  const result = await searchDiseasesLight(searchName, 1, 50);
  const normalized = searchName.toLowerCase();
  const exact = result.diseases.find(
    (d) => d.name.toLowerCase() === normalized,
  );
  if (exact) return exact;
  return result.diseases[0] ?? null;
}

/**
 * Get a disease by name with a specific entity type paginated.
 */
export async function getDiseaseEntityPage(
  name: string,
  entityType: EntityType,
  page: number,
  limit: number,
): Promise<DiseaseDetail | null> {
  const searchName = name.replace(/-/g, " ");
  const result = await searchDiseases(
    searchName,
    [entityType],
    1,
    50,
    { [entityType]: { page, limit } },
  );
  const normalized = searchName.toLowerCase();
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
