import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import SendIcon from '@mui/icons-material/Send'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import type { Disease, Paper as PaperResult } from '@/api'
import { getStats, searchDiseasesLight, searchPapers } from '@/api'

export const Route = createFileRoute('/chatbot')({
  component: RouteComponent,
})

// ── Types ──────────────────────────────────────────────────────────────────────

type MessageContent =
  | { kind: 'text'; text: string }
  | { kind: 'diseases'; diseases: Array<Disease>; query: string }
  | { kind: 'papers'; papers: Array<PaperResult>; disease: string; gene: string }
  | { kind: 'stats'; stats: Record<string, number | undefined> }
  | { kind: 'error'; text: string }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: MessageContent
}

// ── Intent parsing ─────────────────────────────────────────────────────────────

type Intent =
  | { type: 'search_disease'; query: string }
  | { type: 'search_papers'; disease: string; gene: string }
  | { type: 'stats' }
  | { type: 'unknown'; text: string }

function parseIntent(text: string): Intent {
  const lower = text.toLowerCase().trim()

  // Stats
  if (/\b(stats|statistics|overview|summary|how many|counts?)\b/.test(lower)) {
    return { type: 'stats' }
  }

  // Paper search – look for "papers/research on <disease> and <gene>"
  const paperMatch = lower.match(
    /(?:papers?|research|publications?|studies)\s+(?:on|for|about)\s+(.+?)\s+(?:and|with|gene|for)\s+(\w+)/,
  )
  if (paperMatch) {
    return { type: 'search_papers', disease: paperMatch[1].trim(), gene: paperMatch[2].trim() }
  }

  // Paper search – "<gene> in <disease>"
  const paperMatch2 = lower.match(/(\w+)\s+(?:in|for)\s+(.+?)(?:\s+papers?|\s+research)?$/)
  if (
    paperMatch2 &&
    /^[A-Z0-9]{2,10}$/i.test(paperMatch2[1]) &&
    paperMatch2[2].length > 2
  ) {
    return { type: 'search_papers', disease: paperMatch2[2].trim(), gene: paperMatch2[1].trim() }
  }

  // Disease search – anything else with enough substance
  const diseaseMatch = lower.match(
    /(?:search|find|show|get|look up|what is|tell me about|info on|genes? for|proteins? for|data(?:sets?)? for|about)\s+(.+)/,
  )
  if (diseaseMatch && diseaseMatch[1].length > 1) {
    return { type: 'search_disease', query: diseaseMatch[1].replace(/\?$/, '').trim() }
  }

  // Fallback – treat the whole input as a disease search if it's short
  if (lower.length > 1 && lower.length < 80 && !/\?$/.test(lower)) {
    return { type: 'search_disease', query: text.trim() }
  }

  return { type: 'unknown', text: text.trim() }
}

// ── Component ──────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Search glaucoma',
  'Research on glaucoma and MYOC',
  'Show database stats',
  'Find diabetic retinopathy',
]

function RouteComponent() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<Message>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: {
        kind: 'text',
        text: 'Hi! I can help you explore the Ocular Disease Database. Try searching for a disease, looking up research papers for a disease–gene pair, or viewing database statistics.',
      },
    },
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg])

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    setInput('')

    const uid = `${Date.now()}-user`
    addMessage({ id: uid, role: 'user', content: { kind: 'text', text } })
    setLoading(true)

    const intent = parseIntent(text)
    const aid = `${Date.now()}-assistant`

    try {
      switch (intent.type) {
        case 'search_disease': {
          const data = await searchDiseasesLight(intent.query, 1, 10)
          if (data.diseases.length === 0) {
            addMessage({
              id: aid,
              role: 'assistant',
              content: { kind: 'text', text: `No diseases found matching "${intent.query}". Try a different term.` },
            })
          } else {
            addMessage({
              id: aid,
              role: 'assistant',
              content: { kind: 'diseases', diseases: data.diseases, query: intent.query },
            })
          }
          break
        }
        case 'search_papers': {
          addMessage({
            id: `${Date.now()}-searching`,
            role: 'assistant',
            content: { kind: 'text', text: `Searching papers for **${intent.disease}** + **${intent.gene}**…` },
          })
          const res = await searchPapers({
            disease: intent.disease,
            gene: intent.gene,
            limit: 10,
          })
          addMessage({
            id: aid,
            role: 'assistant',
            content: {
              kind: 'papers',
              papers: res.papers,
              disease: res.disease,
              gene: res.gene,
            },
          })
          break
        }
        case 'stats': {
          const s = await getStats()
          addMessage({ id: aid, role: 'assistant', content: { kind: 'stats', stats: s as unknown as Record<string, number> } })
          break
        }
        default:
          addMessage({
            id: aid,
            role: 'assistant',
            content: {
              kind: 'text',
              text: 'I\'m not sure what you\'re looking for. Try:\n• **Search <disease>** to find diseases\n• **Research on <disease> and <gene>** to find papers\n• **Stats** to see database counts',
            },
          })
      }
    } catch {
      addMessage({
        id: aid,
        role: 'assistant',
        content: { kind: 'error', text: 'Something went wrong. The backend may be unavailable — please try again later.' },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDiseaseClick = (disease: Disease) => {
    const slug = disease.name.toLowerCase().replace(/\s+/g, '-')
    void navigate({ to: '/disease/$name', params: { name: slug } })
  }

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', padding: 3 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Research Assistant
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Ask about ocular diseases, genes, datasets, or research papers
      </Typography>

      {/* Suggestion chips */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {SUGGESTIONS.map((label) => (
          <Chip
            key={label}
            label={label}
            size="small"
            variant="outlined"
            onClick={() => void handleSend(label)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Chat area */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '67vh',
        }}
      >
        {/* Messages */}
        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 1.5,
                gap: 1,
                alignItems: 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <SmartToyOutlinedIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: 20 }} />
              )}
              <Box
                sx={{
                  maxWidth: '80%',
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.50',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'grey.200',
                }}
              >
                <RenderContent content={msg.content} onDiseaseClick={handleDiseaseClick} />
              </Box>
              {msg.role === 'user' && (
                <PersonOutlineIcon sx={{ color: 'text.secondary', mt: 0.5, fontSize: 20 }} />
              )}
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3.5, mb: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Thinking…
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Input */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Ask about a disease, gene, or request papers…"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => void handleSend()}
            disabled={loading || !input.trim()}
            startIcon={<SendIcon />}
            sx={{ minWidth: 100, height: 40, textTransform: 'none', borderRadius: 1.5 }}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

// ── Content renderers ──────────────────────────────────────────────────────────

function RenderContent({
  content,
  onDiseaseClick,
}: {
  content: MessageContent
  onDiseaseClick: (d: Disease) => void
}) {
  switch (content.kind) {
    case 'text':
      return <FormattedText text={content.text} />

    case 'diseases':
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Found <strong>{content.diseases.length}</strong> disease{content.diseases.length !== 1 ? 's' : ''} for &quot;{content.query}&quot;:
          </Typography>
          <List disablePadding dense>
            {content.diseases.map((d, idx) => (
              <ListItemButton
                key={d.disease_id}
                onClick={() => onDiseaseClick(d)}
                divider={idx < content.diseases.length - 1}
                sx={{ borderRadius: 1, py: 0.75 }}
              >
                <ListItemText
                  primary={d.name}
                  secondary={`Genes: ${d.counts.genes} · Proteins: ${d.counts.proteins} · ClinVar: ${d.counts.clinvar} · GEO: ${d.counts.geo} · Pathways: ${d.counts.pathways} · Images: ${d.counts.images}`}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )

    case 'papers':
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Found <strong>{content.papers.length}</strong> paper{content.papers.length !== 1 ? 's' : ''} for <strong>{content.disease}</strong> + <strong>{content.gene}</strong>:
          </Typography>
          {content.papers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No papers found for this combination.
            </Typography>
          ) : (
            <List disablePadding dense>
              {content.papers.map((p, idx) => (
                <Box key={idx}>
                  {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                  <Box sx={{ py: 0.75 }}>
                    <Link
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                    >
                      {p.title}
                    </Link>
                    {p.authors.length > 0 && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {p.authors.slice(0, 3).join(', ')}
                        {p.authors.length > 3 ? ` +${p.authors.length - 3} more` : ''}
                      </Typography>
                    )}
                    {p.abstract && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
                        {p.abstract.length > 200 ? `${p.abstract.slice(0, 200)}…` : p.abstract}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </List>
          )}
        </Box>
      )

    case 'stats':
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Database Overview
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {Object.entries(content.stats).map(([key, value]) => (
              <Paper
                key={key}
                elevation={0}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1.5,
                  bgcolor: 'grey.50',
                  minWidth: 120,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'capitalize', display: 'block', mb: 0.5 }}
                >
                  {key}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )

    case 'error':
      return (
        <Typography variant="body2" color="error">
          {content.text}
        </Typography>
      )
  }
}

/** Renders text with basic **bold** support and newlines */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Typography key={i} variant="body2" sx={{ mb: i < lines.length - 1 ? 0.5 : 0 }}>
          {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </Typography>
      ))}
    </>
  )
}
