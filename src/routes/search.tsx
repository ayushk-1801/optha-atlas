import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import SearchIcon from '@mui/icons-material/Search'
import type { Disease } from '@/api'
import { searchDiseasesLight } from '@/api'

export const Route = createFileRoute('/search')({
  component: RouteComponent,
})

const searchTypes = [
  { label: 'All', value: 'all' },
  { label: 'Genes', value: 'genes' },
  { label: 'Proteins', value: 'proteins' },
  { label: 'ClinVar', value: 'clinvar' },
  { label: 'GEO', value: 'geo' },
  { label: 'Pathways', value: 'pathways' },
  { label: 'Images', value: 'images' },
]

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [results, setResults] = useState<Array<Disease>>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) return

    setLoading(true)
    setSearched(true)
    searchDiseasesLight(q, 1, 50)
      .then((data) => {
        setResults(data.diseases)
        setTotal(data.pagination.total)
      })
      .catch(() => {
        setResults([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }

  const handleResultClick = (disease: Disease) => {
    const slug = disease.name.toLowerCase().replace(/\s+/g, '-')
    if (searchType === 'all') {
      void navigate({ to: '/disease/$name', params: { name: slug } })
    } else {
      void navigate({ to: '/disease/$name/$type', params: { name: slug, type: searchType } })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', padding: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          border: '1px solid',
          borderColor: 'grey.300',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search OphthaAtlas..."
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              bgcolor: 'grey.100',
              borderRadius: 1,
            }}
          >
            {searchTypes.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          sx={{
            minWidth: 110,
            height: 40,
            textTransform: 'none',
            borderRadius: 1.5,
          }}
        >
          Search
        </Button>
      </Paper>

      {/* Results */}
      <Box sx={{ mt: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && searched && results.length === 0 && (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
            No diseases found for &quot;{searchQuery}&quot;
          </Typography>
        )}

        {!loading && results.length > 0 && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              {total} result{total !== 1 ? 's' : ''} found
            </Typography>
            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 2 }}
            >
              <List disablePadding>
                {results.map((disease, idx) => {
                  const typeLabel = searchTypes.find((t) => t.value === searchType)?.label ?? 'All'
                  const countForType =
                    searchType === 'all' ? null : disease.counts[searchType as keyof typeof disease.counts]

                  return (
                    <ListItemButton
                      key={disease.disease_id}
                      onClick={() => handleResultClick(disease)}
                      divider={idx < results.length - 1}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText
                        primary={disease.name}
                        secondary={
                          searchType === 'all'
                            ? `Genes: ${disease.counts.genes} · Proteins: ${disease.counts.proteins} · ClinVar: ${disease.counts.clinvar} · GEO: ${disease.counts.geo} · Pathways: ${disease.counts.pathways} · Images: ${disease.counts.images}`
                            : `${typeLabel}: ${countForType} records`
                        }
                      />
                      {countForType != null && (
                        <Chip label={countForType} size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </ListItemButton>
                  )
                })}
              </List>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}
