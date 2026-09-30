ACTION_PROMPTS = {
    'improve': """Enhance and polish the writing for maximum clarity, eloquence, and impact.
- Improve vocabulary and sentence variety while preserving the original authorial voice.
- Eliminate clumsy phrasing, tautologies, and awkward transitions.
- Maintain the user's intended meaning without unnecessary embellishment.""",

    'fix_grammar': """Correct all grammatical errors, spelling typos, punctuation flaws, and syntactical inconsistencies.
CRITICAL INSTRUCTION (DO NOT OVER-CORRECT):
- Only fix actual errors in grammar, agreement, mechanics, and spelling.
- Do NOT rewrite or rephrase sentences simply for stylistic preference.
- Retain the user's authentic voice, rhythm, phrasing, and vocabulary.""",

    'simplify': """Simplify the text to make it effortlessly readable, clear, and direct.
- Replace complex, jargon-heavy, or convoluted sentences with concise, active phrasing.
- Target a clear, friendly readability level (plain language).
- Break run-on sentences into punchy, distinct ideas.""",

    'expand': """Thoughtfully expand upon the provided content with richer depth and substance.
- Elaborate on key arguments, sensory descriptions, or narrative beats.
- Provide illustrative examples, logical context, or deeper character internal thoughts.
- Ensure the expansion feels organic to the original premise without adding meaningless fluff.""",

    'shorten': """Condense the text into a lean, high-density version.
- Remove filler words, redundancies, and tangential clauses.
- Retain every core idea, key fact, and crucial emotional or logical beat.
- Strive for maximum punchiness and economy of language.""",

    'translate': """Translate the content accurately into the target language.
- Provide a culturally resonant and fluent translation that preserves the original intent, tone, emotional nuance, and stylistic register.
- For Hinglish: Output natural, contemporary Romanized Hindi-English colloquial phrasing.
- Avoid mechanical, word-by-word translation.""",

    'change_tone': """Adapt the voice and register of the text to match the requested target tone.
- Re-modulate vocabulary, cadence, and sentence length according to the selected tone.
- Preserve the exact factual or story details while reshaping the emotional and communicative delivery.""",

    'rewrite': """Perform a creative, comprehensive rewrite of the provided text.
- Re-architect sentence order, narrative structure, and thematic flow for maximum resonance.
- Inject fresh phrasing and compelling dynamics while upholding the central premise.""",

    'summarize': """Generate an executive, coherent summary of the provided text.
- Capture the primary thesis, key plot or factual pillars, and principal conclusions.
- Format using clear, crisp bullet points followed by a single-sentence takeaway.""",

    'generate_title': """Generate 5-7 compelling, high-converting title options for the provided content.
- Include a variety of styles (e.g., Curiosity-driven, Direct & Authoritative, Creative/Metaphorical, Question/How-To).
- Rank the best option first.""",

    'generate_intro': """Write a captivating opening section for the provided text.
- Hook the reader instantly with an arresting opening line.
- Establish the stakes, emotional climate, or problem statement cleanly.
- Draw the reader seamlessly into the body of the work.""",

    'generate_conclusion': """Write a powerful, resonant conclusion for the provided text.
- Synthesize the emotional or logical journey without mere repetition.
- End on a memorable lingering thought, decisive call to action, or dramatic resolution.""",

    'generate_outline': """Build a detailed, hierarchical outline for the provided content.
- Structure logically into major parts, sections, and thematic subdivisions.
- Include brief guidance on key points or scenes to include under each heading.""",

    'convert_to_blog': """Reformat and adapt this content into an engaging, structured blog post with catchy title, intro hook, markdown subheadings, readable paragraphs, and takeaway conclusion.""",

    'convert_to_story': """Reformat and expand this content into a rich narrative story complete with scene setting, character stakes, organic dialogue, and narrative arc.""",

    'convert_to_screenplay': """Reformat and convert this content into a screenplay draft format complete with uppercase sluglines (INT./EXT.), present-tense action lines, character names, and dialogue.""",
}

def get_action_directive(action: str) -> str:
    """Retrieve the action directive string or return standard improvement directive."""
    return ACTION_PROMPTS.get(action, ACTION_PROMPTS['improve'])
