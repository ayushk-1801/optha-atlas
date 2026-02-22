import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <div className="App">
    <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>Overview</h1>
    <p>OpthAtlas is a comprehensive database that is dedicated to eye disorders, integrating multi level biological and clinical information to support the ongoing research and discovery. It curates genes, proteins, molecular pathways, clinical variants from ClinVar, datasets from GEO and associated imaging dataset across a wide spectrum of ocular disorders. By using this platform where we bridge genomics, proteomics, transcriptomics and imaging data, researchers can get deeper insights into the mechanism of the diseases along with biomarker discovery and cross diseases comparison with retinal, corneal and optic nerve disorder. This platform is designed to assist researchers, clinicians and students in advancing precision ophthalmology and translation eye research.</p>
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <img src="/home-diagram.png" alt="Home Diagram" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  </div>
}
