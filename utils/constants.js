// Application constants
export const APP_CONFIG = {
  name: 'Idea Forge',
  version: '1.0.0',
  maxCards: 50,
  maxChatHistory: 20,
  autoSaveInterval: 30000, // 30 seconds
};

export const CARD_CATEGORIES = {
  VISUAL: 'visual',
  INTERACTION: 'interaction',
  CONTENT: 'content',
  TECHNICAL: 'technical',
  AESTHETIC: 'aesthetic',
  FUNCTIONAL: 'functional',
  USER_EXPERIENCE: 'user-experience',
  BRANDING: 'branding',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  CONCEPT: 'concept' // Added missing concept category
};

export const CATEGORY_COLORS = {
  [CARD_CATEGORIES.VISUAL]: '#ef4444',         // Red
  [CARD_CATEGORIES.INTERACTION]: '#f97316',    // Orange
  [CARD_CATEGORIES.CONTENT]: '#eab308',        // Yellow
  [CARD_CATEGORIES.TECHNICAL]: '#84cc16',      // Lime
  [CARD_CATEGORIES.AESTHETIC]: '#22c55e',      // Green
  [CARD_CATEGORIES.FUNCTIONAL]: '#14b8a6',     // Teal
  [CARD_CATEGORIES.USER_EXPERIENCE]: '#06b6d4', // Cyan
  [CARD_CATEGORIES.BRANDING]: '#3b82f6',       // Blue
  [CARD_CATEGORIES.PERFORMANCE]: '#8b5cf6',    // Violet
  [CARD_CATEGORIES.ACCESSIBILITY]: '#d946ef',  // Fuchsia
  [CARD_CATEGORIES.CONCEPT]: '#a855f7',        // Purple
  default: '#64748b'                          // Slate
};

export const CARD_TYPES = {
  TEXT: 'text',
  COLOR: 'color',
  LAYOUT: 'layout',
  ANIMATION: 'animation',
  SOUND: 'sound',
  IMAGE: 'image',
  CODE: 'code',
  CONCEPT: 'concept'
};

export const AI_PROMPTS = {
  GENERATE_CARDS: `You are a creative design assistant. Based on the user's concept, generate a diverse set of design component cards that break down their idea into actionable, editable pieces.

Each card should represent a specific aspect of the design that can be individually modified, enhanced, or replaced. Focus on creating cards that span multiple categories:

- Visual elements (colors, typography, imagery, layout)
- Interaction patterns (navigation, user flows, animations)
- Content strategy (messaging, tone, structure)
- Technical considerations (platform, performance, accessibility)
- Aesthetic choices (mood, style, visual language)
- Functional requirements (features, capabilities, constraints)

Respond with a JSON array of card objects with this structure:
{
  "title": "Card Title",
  "category": "category-name",
  "description": "Brief description of what this card controls",
  "content": "Detailed specification or example",
  "tags": ["tag1", "tag2"],
  "type": "card-type"
}`,

  ENHANCE_CARD: `You are a design expert helping to enhance and refine a specific design component. The user will provide a card representing one aspect of their design.

Your job is to:
1. Expand on the existing concept with more detail and specificity
2. Provide concrete examples and implementation suggestions
3. Consider edge cases and variations
4. Suggest complementary ideas that work well with this component
5. Maintain consistency with the overall design vision

Respond with an enhanced version of the card using the same JSON structure.`,

  CRITIQUE_CONCEPT: `You are an experienced design critic providing constructive feedback. Analyze the provided concept or design components and provide honest, actionable criticism that helps improve the overall quality and feasibility of the design.

Consider:
- Usability and user experience
- Technical feasibility
- Visual cohesion
- Accessibility
- Performance implications
- Market relevance
- Innovation vs. convention

Be direct but constructive, and always provide specific suggestions for improvement.
 
The current project context is:
Concept: {{concept}}
Existing Cards: {{cards}}`
};

export const STORAGE_KEYS = {
  PROJECTS: 'ideaforge_projects',
  ACTIVE_PROJECT_ID: 'ideaforge_active_project_id',
  APP_STATE: 'ideaforge_state',
  USER_PREFERENCES: 'ideaforge_preferences'
};