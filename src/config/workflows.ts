/**
 * Workflow contexts and their decision actions (decided: configured per workflow, never hard-coded in a screen).
 * A screen reached from inside a workflow carries `?ctx=<workflowId>:<subject>` plus `&ret=<returnTo>`; the registry below says
 * which decision actions to offer there and what each one writes back. With no ctx, no decision action is shown.
 */
export interface DecisionActionDef { id: string; label: string; effect: 'select-surrogate' | 'select-replacement' | 'add-to-assembly' | 'use-part' }
export interface WorkflowDef { id: string; label: string; actions: DecisionActionDef[]; /** What `subject` refers to, for the audit entry. */ subjectType: string }

export const WORKFLOWS: Record<string, WorkflowDef> = {
  'bom-review': { id: 'bom-review', label: 'BOM review', subjectType: 'bom-line', actions: [{ id: 'select-surrogate', label: 'Select as surrogate', effect: 'select-surrogate' }] },
  'part-replacement': { id: 'part-replacement', label: 'Part replacement', subjectType: 'part', actions: [{ id: 'select-replacement', label: 'Select as replacement part', effect: 'select-replacement' }] },
  'assembly-edit': { id: 'assembly-edit', label: 'Assembly edit', subjectType: 'assembly', actions: [{ id: 'add-to-assembly', label: 'Add to assembly', effect: 'add-to-assembly' }] },
  'catalogue-use': { id: 'catalogue-use', label: 'Catalogue (placeholder)', subjectType: 'project', actions: [{ id: 'use-part', label: 'Use This Part', effect: 'use-part' }] },
}
