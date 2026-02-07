import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Paper from '@mui/material/Paper'
import SearchIcon from '@mui/icons-material/Search'

export const Route = createFileRoute('/search')({
  component: RouteComponent,
})

const searchTypes = [
  { label: 'All', value: 'all' },
  { label: 'Gene', value: 'gene' },
  { label: 'Proteins', value: 'proteins' },
  { label: 'ClinVars', value: 'clinvars' },
  { label: 'GEO', value: 'geo' },
  { label: 'Images', value: 'images' },
]

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')

  const handleSearch = () => {
    // Currently does nothing
  }

  return (
    <Box sx={{ maxWidth: 900, margin: ' auto', padding: 3 }}>
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
            {searchTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
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
    </Box>
  )
}
