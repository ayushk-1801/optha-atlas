import { Link as RouterLink, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import type { Disease, EntityType } from '@/api'
import { getDiseaseByName } from '@/api'

export const Route = createFileRoute('/disease/$name/')({
  component: RouteComponent,
})

const dataCards: Array<{ title: string; key: EntityType; icon: string; color: string }> = [
  { title: 'Genes', key: 'genes', icon: '🧬', color: '#e3f2fd' },
  { title: 'Proteins', key: 'proteins', icon: '🔬', color: '#f3e5f5' },
  { title: 'Images', key: 'images', icon: '🖼️', color: '#e8f5e9' },
  { title: 'GEO', key: 'geo', icon: '📊', color: '#fff3e0' },
  { title: 'ClinVar', key: 'clinvar', icon: '🏥', color: '#fce4ec' },
  { title: 'Pathways', key: 'pathways', icon: '🗺️', color: '#e0f7fa' },
]

function RouteComponent() {
  const { name } = Route.useParams()
  const [disease, setDisease] = useState<Disease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDiseaseByName(name)
      .then((data) => {
        if (!data) {
          setError('Disease not found')
        } else {
          setDisease(data)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [name])

  if (loading) {
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

  return (
    <Box sx={{ margin: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/">
          Home
        </Link>
        <Typography color="text.primary">{disease.name}</Typography>
      </Breadcrumbs>

      {/* Header and Info Section */}
      <Box sx={{ display: 'flex', gap: 4, mb: 6, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            {disease.name}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            Explore the biological and clinical data associated with{' '}
            <strong>{disease.name}</strong>. Click on any of the categories below to view detailed
            information about genes, proteins, clinical variants, GEO datasets, KEGG pathways, and
            image datasets linked to this disease.
          </Typography>
        </Box>
      </Box>

      {/* Data Cards Grid */}
      <Grid container spacing={2}>
        {dataCards.map((card) => {
          const count = disease.counts[card.key]
          return (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.key}>
              <RouterLink
                to="/disease/$name/$type"
                params={{ name, type: card.key }}
                style={{ textDecoration: 'none' }}
              >
                <Card
                  sx={{
                    height: 180,
                    bgcolor: card.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 36, mb: 1 }}>{card.icon}</Typography>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                      {card.title}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      color={count > 0 ? 'primary' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
              </RouterLink>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
