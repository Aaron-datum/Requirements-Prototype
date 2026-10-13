import type { SearchModality } from '../../domain/types'

/** The four modalities (docs/01 "New Search"). Card copy is verbatim from the requirements doc. `needs` is the kind of file the upload must be. */
export interface ModalityDef { id: SearchModality; name: string; badge: string; copy: string; cta: string; gives: string; needs: 'part' | 'assembly'; short: string }

export const MODALITIES: ModalityDef[] = [
  { id: 'part-to-part', name: 'Find similar parts', badge: 'Part → Part', copy: 'Upload a part. Get back individual parts with similar geometry. No assemblies.', cta: 'Upload a part', gives: 'matching parts', needs: 'part', short: 'Part to part' },
  { id: 'part-to-assembly', name: 'Find assemblies that use this part', badge: 'Part → Assembly', copy: 'Upload a part. Get back assemblies that contain similar parts as a sub-component.', cta: 'Upload a part', gives: 'assemblies containing it', needs: 'part', short: 'Part to assembly' },
  { id: 'assembly-to-assembly', name: 'Find similar assemblies', badge: 'Assembly → Assembly', copy: 'Upload an assembly. Get back assemblies with similar structure and matching child parts.', cta: 'Upload an assembly', gives: 'similar assemblies', needs: 'assembly', short: 'Assembly to assembly' },
  { id: 'part-in-assembly-to-part', name: 'Pull matching parts out of assemblies', badge: 'Part-in-Assy → Part', copy: 'Upload a part within an assembly. Get back the matching parts, tagged with their parent assembly.', cta: 'Upload a part in assembly', gives: 'matching parts', needs: 'assembly', short: 'Part in assembly to part' },
]
export const modalityById = (id: string | null | undefined): ModalityDef => MODALITIES.find((m) => m.id === id) ?? MODALITIES[0]!
export const isModality = (v: string | null | undefined): v is SearchModality => MODALITIES.some((m) => m.id === v)

/** Confidence is shown as a number or a word; the filter needs levels. Ordered best to worst. Example thresholds, editable here. */
export const CONFIDENCE_LEVELS: Array<{ label: string; min: number }> = [{ label: 'High', min: 85 }, { label: 'Moderate', min: 65 }, { label: 'Low', min: 0 }]
export const confidenceLevel = (c: { score?: number; label?: string } | undefined): string | undefined => {
  if (!c) return undefined
  if (c.label) return c.label
  if (c.score == null) return undefined
  return CONFIDENCE_LEVELS.find((l) => c.score! >= l.min)?.label
}

/** Where Save Search files a saved search by default (the first seeded project). */
export const DEFAULT_PROJECT_ID = 'p-civic-si'
