import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Paper from '@mui/material/Paper'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import type {
  ClinVarEntry,
  DiseaseDetail,
  EntityType,
  Gene,
  GeoDataset,
  ImageDataset,
  PaginationMeta,
  Pathway,
  Protein,
} from '@/api'
import { getDiseaseEntityPage } from '@/api'

export const Route = createFileRoute('/disease/$name/$type/')({
  component: RouteComponent,
})

// ── Column definitions per entity type ──────────────────────────────────────

interface ColumnDef<T> {
  key: keyof T | string
  label: string
  width?: number | string
  render?: (row: T) => React.ReactNode
}

const GENE_COLUMNS: Array<ColumnDef<Gene>> = [
  { key: 'gene_id', label: 'Gene ID', width: 100 },
  { key: 'symbol', label: 'Symbol', width: 100 },
  { key: 'description', label: 'Description' },
  { key: 'chromosome', label: 'Chr', width: 60 },
  { key: 'map_location', label: 'Map Location', width: 120 },
  { key: 'status', label: 'Status', width: 100 },
]

const PROTEIN_COLUMNS: Array<ColumnDef<Protein>> = [
  { key: 'accession', label: 'Accession', width: 120 },
  { key: 'definition', label: 'Definition' },
  { key: 'length', label: 'Length', width: 80 },
  { key: 'organism', label: 'Organism', width: 140 },
  { key: 'create_date', label: 'Created', width: 100 },
]

const CLINVAR_COLUMNS: Array<ColumnDef<ClinVarEntry>> = [
  { key: 'uid', label: 'UID', width: 80 },
  { key: 'title', label: 'Title' },
  { key: 'clinical_significance', label: 'Significance', width: 160 },
  { key: 'gene_symbols', label: 'Gene', width: 100 },
  { key: 'variant_type', label: 'Variant Type', width: 120 },
  { key: 'protein_change', label: 'Protein Change', width: 130 },
]

const GEO_COLUMNS: Array<ColumnDef<GeoDataset>> = [
  { key: 'accession', label: 'Accession', width: 110 },
  { key: 'title', label: 'Title' },
  { key: 'taxon', label: 'Taxon', width: 120 },
  { key: 'entry_type', label: 'Type', width: 80 },
  { key: 'sample_count', label: 'Samples', width: 80 },
  { key: 'release_date', label: 'Released', width: 100 },
]

const PATHWAY_COLUMNS: Array<ColumnDef<Pathway>> = [
  { key: 'pathway_id', label: 'Pathway ID', width: 120 },
  { key: 'pathway_name', label: 'Name' },
  { key: 'kegg_disease_id', label: 'KEGG Disease', width: 130 },
  {
    key: 'image_url',
    label: 'Image',
    width: 120,
    render: (row) =>
      row.image_url ? (
        <a href={row.image_url} target="_blank" rel="noopener noreferrer">
          <img
            src={row.image_url}
            alt={row.pathway_name}
            style={{ maxWidth: 100, maxHeight: 60, objectFit: 'contain', borderRadius: 4 }}
          />
        </a>
      ) : (
        '—'
      ),
  },
  {
    key: 'pathway_page',
    label: 'Link',
    width: 60,
    render: (row) =>
      row.pathway_page ? (
        <IconButton
          size="small"
          component="a"
          href={row.pathway_page}
          target="_blank"
          rel="noopener noreferrer"
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      ) : (
        '—'
      ),
  },
]

const IMAGE_COLUMNS: Array<ColumnDef<ImageDataset>> = [
  { key: 'source_platform', label: 'Platform', width: 120 },
  {
    key: 'dataset_link',
    label: 'Dataset',
    render: (row) => (
      <Link href={row.dataset_link} target="_blank" rel="noopener noreferrer" underline="hover">
        {row.dataset_link.length > 60 ? row.dataset_link.slice(0, 60) + '…' : row.dataset_link}
      </Link>
    ),
  },
  {
    key: 'paper_link',
    label: 'Paper',
    width: 60,
    render: (row) =>
      row.paper_link ? (
        <IconButton
          size="small"
          component="a"
          href={row.paper_link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      ) : (
        '—'
      ),
  },
  { key: 'healthy_count', label: 'Healthy', width: 80 },
  { key: 'disease_count', label: 'Disease', width: 80 },
]

const COLUMN_MAP: Record<string, Array<ColumnDef<any>>> = {
  genes: GENE_COLUMNS,
  proteins: PROTEIN_COLUMNS,
  clinvar: CLINVAR_COLUMNS,
  geo: GEO_COLUMNS,
  pathways: PATHWAY_COLUMNS,
  images: IMAGE_COLUMNS,
}

const DESCRIPTIONS: Record<string, string> = {
  genes: 'Genes linked to this disease from NCBI Gene database, including symbols, chromosomal locations, and functional descriptions.',
  proteins: 'Protein records associated with this disease, fetched from NCBI Protein database.',
  clinvar: 'Clinical variant records from ClinVar, showing clinical significance, variant types, and molecular consequences.',
  geo: 'Gene Expression Omnibus (GEO) datasets related to this disease, including expression studies and sample counts.',
  pathways: 'KEGG biological pathways associated with this disease.',
  images: 'Retinal and ocular image datasets linked to this disease, from sources like Kaggle and academic papers.',
}

const TYPE_TITLES: Record<string, string> = {
  genes: 'Genes',
  proteins: 'Proteins',
  clinvar: 'ClinVar Variants',
  geo: 'GEO Datasets',
  pathways: 'Pathways',
  images: 'Image Datasets',
}

// ── Filter definitions per entity type ──────────────────────────────────────

interface FilterDef {
  key: string
  label: string
  type: 'text' | 'select'
  /** For select filters: the field to extract unique options from */
  optionsFrom?: string
}

const FILTER_MAP: Record<string, Array<FilterDef>> = {
  genes: [
    { key: '_search', label: 'Search', type: 'text' },
    { key: 'chromosome', label: 'Chromosome', type: 'select', optionsFrom: 'chromosome' },
    { key: 'status', label: 'Status', type: 'select', optionsFrom: 'status' },
  ],
  proteins: [
    { key: '_search', label: 'Search', type: 'text' },
    { key: 'organism', label: 'Organism', type: 'select', optionsFrom: 'organism' },
  ],
  clinvar: [
    { key: '_search', label: 'Search', type: 'text' },
    { key: 'clinical_significance', label: 'Significance', type: 'select', optionsFrom: 'clinical_significance' },
    { key: 'variant_type', label: 'Variant Type', type: 'select', optionsFrom: 'variant_type' },
  ],
  geo: [
    { key: '_search', label: 'Search', type: 'text' },
    { key: 'taxon', label: 'Taxon', type: 'select', optionsFrom: 'taxon' },
    { key: 'entry_type', label: 'Entry Type', type: 'select', optionsFrom: 'entry_type' },
  ],
  pathways: [
    { key: '_search', label: 'Search', type: 'text' },
  ],
  images: [
    { key: '_search', label: 'Search', type: 'text' },
    { key: 'source_platform', label: 'Platform', type: 'select', optionsFrom: 'source_platform' },
  ],
}

/** Text fields to search against for the free-text _search filter */
const SEARCH_FIELDS: Record<string, Array<string>> = {
  genes: ['gene_id', 'symbol', 'description', 'synonyms'],
  proteins: ['accession', 'definition'],
  clinvar: ['uid', 'title', 'gene_symbols', 'protein_change'],
  geo: ['accession', 'title'],
  pathways: ['pathway_id', 'pathway_name'],
  images: ['dataset_link', 'source_platform'],
}

function extractUniqueOptions(rows: Array<Record<string, any>>, field: string): Array<string> {
  const set = new Set<string>()
  for (const row of rows) {
    const val = row[field]
    if (val != null && String(val).trim() !== '') {
      set.add(String(val).trim())
    }
  }
  return Array.from(set).sort()
}

function applyFilters(
  rows: Array<Record<string, any>>,
  filters: Record<string, string>,
  entityType: string,
): Array<Record<string, any>> {
  return rows.filter((row) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      if (key === '_search') {
        const fields = SEARCH_FIELDS[entityType] ?? []
        const q = value.toLowerCase()
        const match = fields.some((f) => {
          const v = row[f]
          return v != null && String(v).toLowerCase().includes(q)
        })
        if (!match) return false
      } else {
        if (String(row[key] ?? '') !== value) return false
      }
    }
    return true
  })
}

function RouteComponent() {
  const { name, type } = Route.useParams()
  const [disease, setDisease] = useState<DiseaseDetail | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0) // 0-indexed for MUI
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const entityType = type as EntityType
  const columns = COLUMN_MAP[entityType] as Array<ColumnDef<any>> | undefined
  const filterDefs = FILTER_MAP[entityType] ?? []

  // Fetch data whenever page, rowsPerPage, or entity type changes (server-side pagination)
  useEffect(() => {
    if (!columns) {
      setError(`Unknown data type: ${type}`)
      setInitialLoading(false)
      return
    }

    const isInitial = !disease
    if (isInitial) {
      setInitialLoading(true)
    } else {
      setPageLoading(true)
    }
    setError(null)
    getDiseaseEntityPage(name, entityType, page + 1, rowsPerPage) // API is 1-indexed
      .then((data) => {
        if (!data) {
          setError('Disease not found')
        } else {
          setDisease(data)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setInitialLoading(false)
        setPageLoading(false)
      })
  }, [name, type, entityType, columns, page, rowsPerPage])

  // Reset page & filters when navigating to a different entity type
  useEffect(() => {
    setPage(0)
    setFilters({})
  }, [entityType])

  // Extract entity wrapper { data, pagination }
  const entityWrapper = disease ? (disease as any)[entityType] : undefined
  const allRows: Array<Record<string, any>> = entityWrapper?.data ?? []
  const serverPagination: PaginationMeta | undefined = entityWrapper?.pagination

  const filteredRows = useMemo(
    () => applyFilters(allRows, filters, entityType),
    [allRows, filters, entityType],
  )

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage)
    setFilters({}) // clear client-side filters on page change
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
    setFilters({})
  }

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, margin: 'auto', py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!disease) return null
  if (!columns) return null

  const totalCount = serverPagination?.total ?? disease.counts[entityType]

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/">
          Home
        </Link>
        <Link underline="hover" color="inherit" href={`/disease/${name}`}>
          {disease.name}
        </Link>
        <Typography color="text.primary">{TYPE_TITLES[entityType] ?? type}</Typography>
      </Breadcrumbs>

      {/* Title & count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {TYPE_TITLES[entityType] ?? type}
        </Typography>
        <Chip label={`${totalCount} records`} color="primary" size="small" />
      </Box>

      {/* Description */}
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        {DESCRIPTIONS[entityType] ?? ''}
      </Typography>

      {/* Content: Filters + Table */}
      {totalCount === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No {(TYPE_TITLES[entityType] ?? type).toLowerCase()} data found for this disease.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
          {/* ── Filter Sidebar ── */}
          <Paper
            elevation={0}
            sx={{
              width: 240,
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
              p: 2,
              position: 'sticky',
              top: 16,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Filters
                </Typography>
              </Box>
              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Clear
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filterDefs.map((fd) => {
                if (fd.type === 'text') {
                  return (
                    <TextField
                      key={fd.key}
                      size="small"
                      label={fd.label}
                      value={filters[fd.key] ?? ''}
                      onChange={(e) => handleFilterChange(fd.key, e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                        },
                      }}
                      fullWidth
                    />
                  )
                }

                const options = extractUniqueOptions(allRows, fd.optionsFrom ?? fd.key)
                return (
                  <FormControl key={fd.key} size="small" fullWidth>
                    <InputLabel>{fd.label}</InputLabel>
                    <Select
                      value={filters[fd.key] ?? ''}
                      label={fd.label}
                      onChange={(e) => handleFilterChange(fd.key, e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {options.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )
              })}
            </Box>

            {activeFilterCount > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Showing {filteredRows.length} of {allRows.length} on this page
                </Typography>
              </>
            )}
          </Paper>

          {/* ── Table ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {filteredRows.length === 0 ? (
              <Alert severity="info">No results match the current filters.</Alert>
            ) : (
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}>
                <TableContainer sx={{ maxHeight: 640 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.50', width: 50 }}>#</TableCell>
                        {columns.map((col) => (
                          <TableCell
                            key={String(col.key)}
                            sx={{
                              fontWeight: 600,
                              bgcolor: 'grey.50',
                              ...(col.width ? { width: col.width } : {}),
                            }}
                          >
                            {col.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageLoading
                        ? Array.from({ length: rowsPerPage }).map((_, i) => (
                            <TableRow key={`skeleton-${String(i)}`}>
                              <TableCell>
                                <Skeleton variant="text" width={30} />
                              </TableCell>
                              {columns.map((col) => (
                                <TableCell key={String(col.key)}>
                                  <Skeleton variant="text" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        : filteredRows.map((row, index) => (
                            <TableRow
                              key={row.id ?? index}
                              sx={{
                                '&:hover': { bgcolor: 'grey.50' },
                                '&:last-child td': { borderBottom: 0 },
                              }}
                            >
                              <TableCell sx={{ color: 'text.secondary' }}>
                                {page * rowsPerPage + index + 1}
                              </TableCell>
                              {columns.map((col) => (
                                <TableCell key={String(col.key)}>
                                  {col.render ? (
                                    col.render(row)
                                  ) : (
                                    <CellValue value={row[col.key as string]} />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </Paper>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}

/** Renders a cell value, truncating long text with a tooltip. */
function CellValue({ value }: { value: unknown }) {
  if (value == null) return <span style={{ color: '#999' }}>—</span>

  const str = String(value)
  if (str.length > 100) {
    return (
      <Tooltip title={str} arrow>
        <span>{str.slice(0, 100)}…</span>
      </Tooltip>
    )
  }
  return <>{str}</>
}
