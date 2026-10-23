/**
 * ORBIS — Interpretive content library.
 * Every reading in the app is composed from these fragments, keyed strictly
 * by the computed signs, houses, planets and aspects of the user's chart.
 */
import type { AspectType, Element, Modality, PlanetId, PointId } from './astroEngine';

export interface SignLore {
  keywords: [string, string, string];
  gift: string;
  shadow: string;
  sun: string;
  moon: string;
  rising: string;
  venus: string;
  mars: string;
  mercury: string;
  career: string;
  saturn: string;
  vocation: string;
  partner: string;
}

export const SIGN_LORE: SignLore[] = [
  {
    keywords: ['Initiative', 'Courage', 'Spark'],
    gift: 'fearless initiation', shadow: 'impatience and burnout',
    sun: 'Your core gravity is ignition. You come alive at the start line, leading through action and proving yourself in real time.',
    moon: 'Your emotions arrive fast and hot, then clear quickly. You self-soothe through movement, independence and a sense of forward momentum.',
    rising: 'You enter rooms like a spark — direct, energetic and unmistakably present. People read you as brave before they know your story.',
    venus: 'You love in pursuit. Attraction ignites through chemistry, honesty and a little challenge; boredom is the true dealbreaker.',
    mars: 'Desire is immediate and transparent. You chase what you want openly and respect partners who match your fire.',
    mercury: 'You think in headlines and speak in verbs — quick, decisive, allergic to waffle.',
    career: 'You excel as an initiator: launching projects, opening markets and leading from the front line.',
    saturn: 'Your mastery lesson is patience — learning that true leadership includes finishing what you start.',
    vocation: 'entrepreneurship, athletics, emergency response, founding and pioneering roles',
    partner: 'a bold, autonomous partner who keeps the spark alive',
  },
  {
    keywords: ['Stability', 'Sensuality', 'Value'],
    gift: 'unshakeable steadiness', shadow: 'stubborn resistance to change',
    sun: 'Your core gravity is cultivation. You build slowly and beautifully, valuing what is real, tangible and made to last.',
    moon: 'You need emotional safety through routine, comfort and the senses — good food, touch, nature and financial calm.',
    rising: 'You project calm and quiet magnetism. Others experience you as grounded, tasteful and reassuringly reliable.',
    venus: 'Venus is at home here: you love through loyalty, presence and pleasure. Slow-burn attraction outlasts every flash in the pan.',
    mars: 'Your drive is a steady engine. Slow to anger and slower to quit, you pursue desire with remarkable endurance.',
    mercury: 'You think practically and speak deliberately. Once you have formed an opinion, it is built on bedrock.',
    career: 'You excel at building durable value — finance, craft, design and anything that compounds over time.',
    saturn: 'Your mastery lesson is healthy flexibility — releasing security attachments that quietly limit growth.',
    vocation: 'finance, real estate, culinary arts, luxury design, agriculture and wealth stewardship',
    partner: 'a steady, sensual partner who offers loyalty and long-term security',
  },
  {
    keywords: ['Curiosity', 'Wit', 'Connection'],
    gift: 'agile intelligence', shadow: 'scattered focus and restlessness',
    sun: 'Your core gravity is curiosity. You orbit ideas, people and information — alive whenever there is something new to learn and share.',
    moon: 'You process feelings by talking them through. Mental stimulation and variety are your emotional oxygen.',
    rising: 'You come across as bright, witty and approachable — the conversational connector in any room.',
    venus: 'You fall for minds first. Banter, playful flirtation and shared curiosity are your love language.',
    mars: 'You pursue desire through words and wit; mental chemistry is the trigger, and variety keeps the fire lit.',
    mercury: 'Mercury rules here: your mind is lightning-fast, multilingual in ideas and naturally persuasive.',
    career: 'You excel at communication, networking, writing and roles that juggle many moving parts.',
    saturn: 'Your mastery lesson is depth — committing to one body of knowledge until it becomes true authority.',
    vocation: 'media, writing, teaching, sales, technology and translation',
    partner: 'a witty, curious partner who keeps conversations endlessly interesting',
  },
  {
    keywords: ['Nurture', 'Intuition', 'Belonging'],
    gift: 'protective intuition', shadow: 'moodiness and defensive withdrawal',
    sun: 'Your core gravity is belonging. You lead by caring, building emotional homes for the people and projects you love.',
    moon: 'The Moon is at home here: your feelings are tidal, deep and intuitive. Nurturing others — and being nurtured — is essential.',
    rising: 'You appear gentle, receptive and protective. People instinctively trust you with what matters to them.',
    venus: 'You love by caring for someone deeply. Emotional safety and a sense of "home" are non-negotiable in romance.',
    mars: 'Your drive moves sideways like the crab — protective, strategic and fiercely defensive of your inner circle.',
    mercury: 'You think with your memory and feelings; your intuition often knows before your logic catches up.',
    career: 'You excel where care meets strategy — hospitality, people leadership and building loyal communities.',
    saturn: 'Your mastery lesson is emotional self-sufficiency — learning to parent yourself as well as you parent others.',
    vocation: 'hospitality, healthcare, real estate, family business, counselling and food',
    partner: 'a devoted, emotionally available partner who builds a true home with you',
  },
  {
    keywords: ['Radiance', 'Creativity', 'Heart'],
    gift: 'generous radiance', shadow: 'pride and need for applause',
    sun: 'The Sun is at home here: your core gravity is radiance. You are built to create, lead and be seen, warming everyone in your orbit.',
    moon: 'You need to feel appreciated and admired. Play, romance and creative expression restore your emotional light.',
    rising: 'You carry a regal presence — warm, expressive and impossible to overlook. You naturally take centre stage.',
    venus: 'You love grandly — with devotion, romance and generosity — and you need a partner who openly adores you.',
    mars: 'Your drive is theatrical and wholehearted. You pursue desire with confidence, pride and creative flair.',
    mercury: 'You speak with authority and charisma; storytelling is your most persuasive tool.',
    career: 'You excel in visible leadership, creative direction and any role where your vision inspires others.',
    saturn: 'Your mastery lesson is earned confidence — leading from the heart even without applause.',
    vocation: 'creative direction, entertainment, executive leadership, brand building and education',
    partner: 'a loyal, admiring partner who celebrates your light and shares the stage',
  },
  {
    keywords: ['Precision', 'Service', 'Refinement'],
    gift: 'discerning precision', shadow: 'perfectionism and self-criticism',
    sun: 'Your core gravity is refinement. You are here to improve, analyse and serve — turning chaos into elegant systems.',
    moon: 'You feel safest when life is orderly. Small rituals, usefulness and clean spaces soothe your nervous system.',
    rising: 'You appear composed, observant and quietly competent — the person who notices what everyone else missed.',
    venus: 'You love through acts of service and attentive detail. Devotion is shown in what you do, not just what you say.',
    mars: 'Your drive is meticulous and efficient. You pursue goals methodically and rarely waste energy.',
    mercury: 'Mercury is exalted here: analytical, precise and brilliant at editing, diagnosing and problem-solving.',
    career: 'You excel in roles demanding precision — analysis, operations, health, editing and quality systems.',
    saturn: 'Your mastery lesson is "good enough" — releasing perfectionism so mastery can actually ship.',
    vocation: 'analytics, healthcare, operations, editing, research and wellness',
    partner: 'a thoughtful, dependable partner who shows love through everyday devotion',
  },
  {
    keywords: ['Harmony', 'Grace', 'Partnership'],
    gift: 'diplomatic grace', shadow: 'indecision and people-pleasing',
    sun: 'Your core gravity is harmony. You come alive in partnership, beauty and fairness — always seeking the balancing point.',
    moon: 'You need peace and beauty around you. Emotional balance comes through connection, art and harmonious relationships.',
    rising: 'You project charm, elegance and approachability. People feel instantly at ease in your presence.',
    venus: 'Venus rules here: you are a natural romantic who loves through courtship, aesthetics and true partnership.',
    mars: 'You pursue desire with diplomacy and charm, though direct conflict can feel uncomfortable.',
    mercury: 'You think in perspectives and speak with tact; negotiation and mediation come naturally.',
    career: 'You excel in partnership-driven work — law, design, diplomacy, client relations and curation.',
    saturn: 'Saturn is exalted here: your mastery lesson is committed, fair partnership and principled justice.',
    vocation: 'law, design, diplomacy, fashion, curation and partnership consulting',
    partner: 'an elegant, fair-minded partner who values true equality',
  },
  {
    keywords: ['Depth', 'Power', 'Transformation'],
    gift: 'transformative depth', shadow: 'control and suspicion',
    sun: 'Your core gravity is depth. You are drawn to truth beneath the surface, and you transform everything you touch.',
    moon: 'Your emotions run deep and private. You need intense, trustworthy bonds and space to process alone.',
    rising: 'You project magnetic intensity and mystery. People sense your power long before you reveal it.',
    venus: 'You love all-in or not at all. Trust, loyalty and soul-level intimacy matter more than surface romance.',
    mars: 'Mars rules here: your drive is strategic, relentless and quietly formidable once your mind is set.',
    mercury: 'You think like an investigator — penetrating, perceptive and impossible to fool.',
    career: 'You excel in high-stakes, transformational work — strategy, research, finance, psychology and crisis.',
    saturn: 'Your mastery lesson is trust — wielding power transparently and letting go of what is complete.',
    vocation: 'psychology, investigation, strategy, finance, medicine and research',
    partner: 'a deeply loyal partner capable of complete emotional honesty',
  },
  {
    keywords: ['Expansion', 'Vision', 'Freedom'],
    gift: 'visionary optimism', shadow: 'overpromising and restlessness',
    sun: 'Your core gravity is expansion. You are a seeker — of meaning, adventure and the bigger picture.',
    moon: 'You need freedom and meaning to feel emotionally well. Travel, learning and laughter lift your spirit.',
    rising: 'You come across as open, adventurous and optimistic — a natural guide and storyteller.',
    venus: 'You love as an adventure. Shared exploration, honesty and philosophical connection keep romance alive.',
    mars: 'Your drive is enthusiastic and expansive; you pursue desire like a quest, chasing horizons.',
    mercury: 'You think in big ideas and grand theories; you teach, inspire and speak with infectious conviction.',
    career: 'You excel in roles with vision and scope — education, publishing, global business and thought leadership.',
    saturn: 'Your mastery lesson is grounded wisdom — turning beliefs into disciplined, lived practice.',
    vocation: 'education, publishing, travel, law, global strategy and philosophy',
    partner: 'an adventurous, philosophical partner who expands your world',
  },
  {
    keywords: ['Ambition', 'Structure', 'Mastery'],
    gift: 'strategic mastery', shadow: 'rigidity and emotional reserve',
    sun: 'Your core gravity is mastery. You are built for the long climb, earning authority through discipline and results.',
    moon: 'You find emotional safety in competence and control. Achievement soothes you; vulnerability takes trust.',
    rising: 'You project authority, composure and quiet ambition. People assume you are in charge — often correctly.',
    venus: 'You love with commitment and quiet loyalty. Romance deepens over time and proves itself through reliability.',
    mars: 'Mars is exalted here: your drive is disciplined, strategic and built for long-term victories.',
    mercury: 'You think structurally and speak with authority; your plans are practical and well-sequenced.',
    career: 'You excel as an architect of systems — management, governance, finance and enduring institutions.',
    saturn: 'Saturn rules here: your mastery lesson is balancing ambition with rest, warmth and self-worth beyond status.',
    vocation: 'executive management, governance, architecture, finance and engineering',
    partner: 'a mature, ambitious partner who builds a shared legacy with you',
  },
  {
    keywords: ['Innovation', 'Vision', 'Independence'],
    gift: 'original vision', shadow: 'detachment and contrarianism',
    sun: 'Your core gravity is innovation. You orbit the future — independent, humanitarian and unafraid to be different.',
    moon: 'You need intellectual freedom and space. You process emotion through perspective, friendship and ideals.',
    rising: 'You come across as original, friendly and slightly unconventional — memorable for your unique point of view.',
    venus: 'You love through friendship and freedom. Mental connection and respect for individuality are essential.',
    mars: 'Your drive is inventive and collective — you fight hardest for ideas and causes bigger than yourself.',
    mercury: 'You think in systems and innovations; your mind leaps to solutions others have not imagined yet.',
    career: 'You excel in innovative, future-facing work — technology, science, social impact and networks.',
    saturn: 'Saturn rules here: your mastery lesson is building structures that serve the collective future.',
    vocation: 'technology, science, social impact, product innovation and community building',
    partner: 'an original, independent partner who is also your best friend',
  },
  {
    keywords: ['Empathy', 'Imagination', 'Transcendence'],
    gift: 'boundless empathy', shadow: 'escapism and porous boundaries',
    sun: 'Your core gravity is imagination. You are a dreamer and healer, dissolving boundaries with compassion and art.',
    moon: 'You feel everything — your own emotions and other people\'s. Solitude, music and water restore your spirit.',
    rising: 'You project softness, mystique and empathy. People feel seen and understood in your presence.',
    venus: 'Venus is exalted here: you love unconditionally and romantically, seeking a soulmate connection.',
    mars: 'Your drive flows like water — intuitive, adaptable, and most powerful when inspired by compassion.',
    mercury: 'You think in images and impressions; intuition and creative storytelling are your strengths.',
    career: 'You excel in creative and healing work — arts, music, film, therapy and spiritual guidance.',
    saturn: 'Your mastery lesson is boundaries — giving structure to your compassion so it never drains you.',
    vocation: 'arts, music, film, healing, therapy and spiritual or charitable work',
    partner: 'a compassionate, soulful partner who honours your sensitivity',
  },
];

export interface PlanetLore {
  name: string;
  title: string;
  principle: string;
  need: string;
  action: string;
  color: string;
}

export const PLANET_LORE: Record<PlanetId, PlanetLore> = {
  sun: { name: 'Sun', title: 'Core Gravity', principle: 'your core identity and will', need: 'self-expression', action: 'put your name on something visible — pitch it, publish it or present it', color: '#E5C158' },
  moon: { name: 'Moon', title: 'Emotional Tide', principle: 'your emotional needs and instincts', need: 'emotional safety', action: 'block protected recovery time and trust your gut on one pending decision', color: '#E2E8F0' },
  mercury: { name: 'Mercury', title: 'Mind & Voice', principle: 'your mind and voice', need: 'clarity and understanding', action: 'write, negotiate or have the conversation you have been postponing', color: '#38BDF8' },
  venus: { name: 'Venus', title: 'Magnetism', principle: 'your capacity for love, beauty and value', need: 'harmony and connection', action: 'reach out, create something beautiful, or ask for what you are worth', color: '#F9A8D4' },
  mars: { name: 'Mars', title: 'Drive', principle: 'your drive, desire and courage', need: 'autonomy and action', action: 'tackle your hardest task first thing in the morning, before any inbox', color: '#F87171' },
  jupiter: { name: 'Jupiter', title: 'Expansion', principle: 'your faith, growth and fortune', need: 'growth and meaning', action: 'say yes to one expansive invitation or learning opportunity', color: '#A78BFA' },
  saturn: { name: 'Saturn', title: 'Mastery', principle: 'your discipline, limits and long-term mastery', need: 'security and achievement', action: 'commit to one non-negotiable 7-day structure and track it', color: '#94A3B8' },
};

export const POINT_NAMES: Record<PointId, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', asc: 'Ascendant', mc: 'Midheaven',
};

export const HOUSE_LORE: { name: string; domain: string }[] = [
  { name: 'Self', domain: 'identity, body and first impressions' },
  { name: 'Resources', domain: 'money, possessions and self-worth' },
  { name: 'Mind', domain: 'communication, learning and your local world' },
  { name: 'Roots', domain: 'home, family and emotional foundations' },
  { name: 'Creation', domain: 'romance, creativity and joy' },
  { name: 'Craft', domain: 'daily work, health and rituals' },
  { name: 'Partnership', domain: 'committed relationships and contracts' },
  { name: 'Depth', domain: 'intimacy, shared resources and transformation' },
  { name: 'Horizon', domain: 'travel, philosophy and higher learning' },
  { name: 'Legacy', domain: 'career, reputation and public standing' },
  { name: 'Network', domain: 'friendships, communities and future goals' },
  { name: 'Sanctuary', domain: 'solitude, the subconscious and spiritual renewal' },
];

export const ASPECT_LORE: Record<AspectType, { verb: string; template: string; transitTone: string }> = {
  conjunction: {
    verb: 'fuses with',
    template: '{A} and {B} operate as one fused engine — they cannot act independently, amplifying each other for better and for worse.',
    transitTone: 'merges with and supercharges',
  },
  sextile: {
    verb: 'opens doors for',
    template: '{A} and {B} cooperate the moment you take initiative. This is an opportunity channel that rewards conscious effort.',
    transitTone: 'opens a window of opportunity for',
  },
  square: {
    verb: 'challenges',
    template: '{A} grinds against {B}, generating friction that demands action. Handled consciously, this tension becomes your greatest growth engine.',
    transitTone: 'pressures and activates',
  },
  trine: {
    verb: 'flows with',
    template: '{A} flows effortlessly into {B}. This is a natural gift that works almost without trying — the only risk is taking it for granted.',
    transitTone: 'flows supportively into',
  },
  opposition: {
    verb: 'polarises',
    template: '{A} and {B} pull from opposite ends of your chart, seeking balance. You often meet this polarity through other people.',
    transitTone: 'illuminates and polarises',
  },
};

export const ELEMENT_LORE: Record<Element, { label: string; color: string; quality: string; ritualTitle: string; ritual: string[]; why: string }> = {
  fire: {
    label: 'Fire', color: '#F97316', quality: 'vitality, courage and inspiration',
    ritualTitle: 'Morning Ignition Protocol',
    ritual: ['10 minutes of vigorous movement before you touch a screen', 'State one bold intention for the day out loud', 'Take one small, visible risk before noon'],
    why: 'Low fire can feel like hesitation, low motivation or waiting for permission.',
  },
  earth: {
    label: 'Earth', color: '#84CC16', quality: 'grounding, structure and follow-through',
    ritualTitle: 'Grounding Root Ritual',
    ritual: ['10 minutes barefoot on soil, grass or stone', 'Cook one meal from scratch, slowly and without screens', 'Finish and physically tick off three tangible tasks'],
    why: 'Low earth can feel like scattered energy, unfinished plans or money and body neglect.',
  },
  air: {
    label: 'Air', color: '#38BDF8', quality: 'perspective, communication and objectivity',
    ritualTitle: 'Clear Sky Practice',
    ritual: ['15 minutes of free-writing to externalise your thoughts', 'Four rounds of 4-7-8 breathing at midday', 'One curious conversation with someone outside your usual circle'],
    why: 'Low air can feel like being too close to your feelings to see the bigger picture.',
  },
  water: {
    label: 'Water', color: '#818CF8', quality: 'emotional intelligence, intuition and empathy',
    ritualTitle: 'Evening Tide Ritual',
    ritual: ['A warm shower or bath, consciously releasing the day', 'Write three feelings — not thoughts — in a journal', 'Ten minutes of music that genuinely moves you'],
    why: 'Low water can feel like emotional disconnection, dryness or difficulty receiving support.',
  },
};

export const MODALITY_LORE: Record<Modality, { label: string; color: string; style: string; timing: string; rule: string }> = {
  cardinal: {
    label: 'Cardinal', color: '#E5C158',
    style: 'You are an initiator: you decide quickly and course-correct in motion.',
    timing: 'Make key decisions within 48 hours of receiving information, and launch conversations early in the day and early in the week. New Moons are your green lights.',
    rule: 'Decide fast, refine later — but build one review checkpoint into every launch.',
  },
  fixed: {
    label: 'Fixed', color: '#A78BFA',
    style: 'You are a stabiliser: you need incubation time, but once decided you are unstoppable.',
    timing: 'Sleep on important decisions for 72 hours, and schedule high-stakes conversations mid-week when you have settled into your rhythm. Full Moons reveal what needs to change.',
    rule: 'Protect your incubation window, then commit wholeheartedly — and revisit the plan quarterly.',
  },
  mutable: {
    label: 'Mutable', color: '#38BDF8',
    style: 'You are an adapter: you gather options brilliantly and thrive on flexibility.',
    timing: 'Set a firm decision deadline before you begin researching, and hold important talks once you have mapped the options. Waning Moon phases help you edit and choose.',
    rule: 'Collect, compare, then close — cap yourself at three final options.',
  },
};

export const SHADOW_PROMPTS: Record<'square' | 'opposition', { shift: string; prompt: string }> = {
  square: {
    shift: 'Friction is not failure — it is the signal that two parts of you are ready to collaborate. Treat the tension as raw fuel, not as proof that something is wrong.',
    prompt: 'Where does my need for {needA} collide with my need for {needB}? What would one small action that honours both look like this week?',
  },
  opposition: {
    shift: 'The people who frustrate you often mirror a part of you seeking expression. Integrate rather than choosing sides — you need both ends of this axis.',
    prompt: 'When I swing between {needA} and {needB}, who in my life tends to carry the side I am neglecting? What would it mean to reclaim that side myself?',
  },
};

export const TRANSIT_THEMES: Record<string, string> = {
  sun: 'puts the spotlight on',
  mercury: 'brings key conversations and decisions around',
  venus: 'sweetens love, money and pleasure through',
  mars: 'injects energy, urgency and courage into',
  jupiter: 'expands and blesses',
  saturn: 'tests, matures and restructures',
};
