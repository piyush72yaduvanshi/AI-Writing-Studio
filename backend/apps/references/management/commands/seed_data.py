from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.references.models import WritingReference, ReferenceCategory, ReferenceStatus
from apps.documents.models import Document, WritingMode, WritingLanguage, WritingTone
from apps.references.services import ReferenceService
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

SEED_REFERENCES = [
    {
        'title': 'Blake Snyder Save The Cat 15-Beat Screenplay Framework',
        'category': ReferenceCategory.SCREENPLAY_RULES,
        'content': """# Blake Snyder Save The Cat 15-Beat Screenplay Framework

## 1. Beat Sheet Overview & Page Targets (110-Page Feature)
- **Beat 1: Opening Image (p. 1)**: Snapshot of protagonist's starting world, tone, and character flaw before transformation.
- **Beat 2: Theme Stated (p. 5)**: Subtle statement by a secondary character revealing what protagonist must learn to survive.
- **Beat 3: Set-up (pp. 1-10)**: Establish status quo, the protagonist's ticking clock, and the 'six things that need fixing'.
- **Beat 4: Catalyst (p. 12)**: The life-altering event knocking the protagonist's world off balance.
- **Beat 5: Debate (pp. 12-25)**: The resistance phase: "Can I dare to do this?" Stating stakes and doubt.
- **Beat 6: Break into Two (p. 25)**: The protagonist actively chooses the adventure, stepping into the upside-down world.
- **Beat 7: B Story (p. 30)**: Love interest, mentor, or foil relationship that embodies the theme.
- **Beat 8: Fun and Games (pp. 30-55)**: The 'promise of the premise'. Core trailers scenes, highs, and initial victories.
- **Beat 9: Midpoint (p. 55)**: False victory or false defeat. The stakes raise from public to personal. A ticking clock begins.
- **Beat 10: Bad Guys Close In (pp. 55-75)**: External pressure builds while internal doubts and fissures fracture the team.
- **Beat 11: All is Lost (p. 75)**: The lowest point. The "whiff of death" (literal or symbolic). The old plan is dead.
- **Beat 12: Dark Night of the Soul (pp. 75-85)**: Wall of grief. Protagonist must surrender their original ego/flaw.
- **Beat 13: Break into Three (p. 85)**: The "Aha!" epiphany. Synthesizing the A Story goal with the B Story moral lesson.
- **Beat 14: Finale (pp. 85-110)**: Five-point finale: Gathering team, Executing plan, High tower surprise, Moral sacrifice, Ultimate climax.
- **Beat 15: Final Image (p. 110)**: Mirror image of Beat 1 proving the permanent internal and external metamorphosis.

## 2. Sluglines & Action Rhythm
- Always format sluglines in uppercase: `INT. LOCATION - TIME OF DAY`.
- Avoid passive verbs; write in punchy, visual, present-tense sensory beats (1-3 sentences per action block)."""
    },
    {
        'title': 'Indian OTT Web Series Episodic Engine & Cold-Open Architecture',
        'category': ReferenceCategory.SCREENPLAY_RULES,
        'content': """# Indian OTT Web Series Episodic Engine & Cold-Open Architecture

## 1. The Episodic Engine
A successful episodic drama (Crime, Political Thriller, Family Drama, Noir) relies on an interlocking 'Series Engine':
- **Macro Arc (Seasonal Drive)**: The overwhelming societal or institutional conflict (e.g., syndicate turf war, political election, serial crime investigation).
- **Meso Arc (Episodic Goal)**: What the character must resolve by the 45-minute mark (e.g., secure an informer, plant surveillance, survive an ambush).
- **Micro Arc (Relational Subtext)**: Family obligations, marital strain, hidden debt, generational trauma.

## 2. Cold-Open Construction (Minutes 0-5)
- Open in media res with an intense sensory dilemma before title sequence.
- Plant a dramatic question that reshapes the entire episode's stakes.

## 3. Hinglish & Indian Code-Switching Conventions
- **Code-Switching Cadence**: Characters naturally switch between colloquial Hindi/Urdu for raw instinctive emotions, curses, or heartfelt confessions, and English for professional, bureaucratic, or analytical statements.
- **Cultural Subtext**: Honor, filial duty (*'izzat'*), bureaucratic corruption (*'jugaad'*), and socioeconomic divide should influence dialogue subtext without needing overt exposition.
- **Cliffhangers**: Conclude each episode on an irreversible reversal (*peripeteia*) that renders retreat impossible."""
    },
    {
        'title': 'Robert McKee Story & Scene Value-Charge Architecture',
        'category': ReferenceCategory.STORYTELLING,
        'content': """# Robert McKee Story & Scene Value-Charge Architecture

## 1. Scene Value-Charge Transition
Every dramatic scene must transition from one value state to another (Positive to Negative, or Negative to Positive):
- If a scene starts with Hope (+), it must end with Betrayal or Dread (-).
- A scene that starts Neutral and ends Neutral is dead weight and must be cut or redesigned.

## 2. Character Want vs. Need
- **Want (Conscious Objective)**: The tangible exterior goal the character believes will solve their problems (Money, Promotion, Revenge, Status).
- **Need (Unconscious Moral Awakening)**: What the character actually requires to heal their fatal wound (Self-forgiveness, Humility, Vulnerability, Truth).
- The story climax forces the protagonist to sacrifice their Want in order to fulfill their Need.

## 3. Subtextual Dialogue Directives
- Never write "on-the-nose" dialogue where a character states their exact feelings.
- Characters weaponize humor, changing the topic, withholding information, silence, and false agreements to protect their vulnerability."""
    },
    {
        'title': 'High-Converting Copywriting & Article PAS/AIDA Frameworks',
        'category': ReferenceCategory.BLOG_STANDARDS,
        'content': """# High-Converting Copywriting & Article PAS/AIDA Frameworks

## 1. Problem-Agitate-Solve (PAS)
- **Problem**: State the acute pain point immediately in the first 2 sentences. Use visceral, recognizable symptoms.
- **Agitate**: Dig into the hidden consequences of ignoring the problem. Quantify the emotional, financial, or cognitive cost.
- **Solve**: Introduce the systematic framework or solution with crisp, step-by-step clarity.

## 2. AIDA Formula
- **Attention**: The Hook. High-contrast assertion, counter-intuitive insight, or shocking industry statistic.
- **Interest**: Relatable storytelling, revealing why conventional methods fail.
- **Desire**: Paint the after-state picture (*transformation*). Provide concrete proof points.
- **Action**: Direct, friction-free Call to Action (CTA).

## 3. SEO & Formatting Best Practices
- Keep paragraphs under 3 sentences for mobile readability.
- Use bold keywords for scannability.
- Use numbered lists for sequential steps and bullet points for feature sets."""
    },
    {
        'title': 'Barbara Minto Executive Pyramid Principle & BLUF Communication',
        'category': ReferenceCategory.GUIDELINES,
        'content': """# Barbara Minto Executive Pyramid Principle & BLUF Communication

## 1. Bottom Line Up Front (BLUF)
- Never bury the conclusion at the bottom of the analysis.
- State the answer, core recommendation, or thesis in the very first sentence.

## 2. The SCQA Framework
- **Situation**: Context that everyone agrees upon (the indisputable baseline).
- **Complication**: What changed or went wrong (the catalyst that demands action).
- **Question**: The central dilemma: "How do we solve X without causing Y?"
- **Answer**: Your clear, validated recommendation.

## 3. MECE (Mutually Exclusive, Collectively Exhaustive)
- When categorizing arguments or proposals, ensure sections do not overlap and leave zero unexplained gaps."""
    },
    {
        'title': 'Hinglish Dialogue Master Bible & Cultural Nuance Guide',
        'category': ReferenceCategory.GUIDELINES,
        'content': """# Hinglish Dialogue Master Bible & Cultural Nuance Guide

## 1. Authentic Cadence vs. Robotic Translation
- **Never translate literally**: Word-by-word translations sound awkward and robotic. (e.g., *"mera dimaag kharab ho gaya hai"* translates to intense cognitive overwhelm/frustration, not *"my brain went bad"*).
- **Preserve Colloquial Fillers**: Use natural conversational markers in Hinglish dialogue: *"yaar"*, *"bhai"*, *"matlab"*, *"arre"*, *"dekh"*, *"pakka"*, *"scene kya hai"*.
- **Code-Mixing Balance**: In urban dialogue, 60% English vocabulary mixed with Hindi grammatical scaffolding reflects contemporary metro speech (Mumbai, Delhi, Bangalore youth & creative culture).

## 2. Preserving Emotional Stakes
- When translating raw Hinglish input into polished English prose: preserve the hyper-specific cultural tensions, family expectations, and dramatic urgency without sterilizing the author's distinct flavor."""
    }
]

class Command(BaseCommand):
    help = 'Seed demo references, admin user, and sample documents'

    def handle(self, *args, **options):
        self.stdout.write("Starting AI Writing Studio seed process...")

        # 1. Admin / Demo User
        admin_email = 'admin@aiwritingstudio.local'
        admin_user = User.objects.filter(email=admin_email).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password='StudioPassword123!',
                username='admin',
                first_name='Studio',
                last_name='Admin'
            )
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {admin_email} (Password: StudioPassword123!)"))
        else:
            self.stdout.write(f"Admin user already exists: {admin_email}")

        # 2. Seed Global References
        for ref_data in SEED_REFERENCES:
            ref, created = WritingReference.objects.get_or_create(
                title=ref_data['title'],
                defaults={
                    'user': admin_user,
                    'category': ref_data['category'],
                    'text_content': ref_data['content'],
                    'is_global': True,
                    'status': ReferenceStatus.PENDING,
                }
            )
            if created:
                self.stdout.write(f"Created reference: {ref.title}")
                # Attempt to index if services are up
                try:
                    ReferenceService.index_reference_content(ref)
                except Exception as exc:
                    self.stdout.write(self.style.WARNING(f"Note: Could not immediately index reference (Ollama/Qdrant may not be up yet): {exc}"))

        # 3. Seed Sample Documents
        sample_doc, doc_created = Document.objects.get_or_create(
            user=admin_user,
            title='The Silent Signal - Sci-Fi Thriller Outline',
            defaults={
                'content': "A radio astronomer working in an isolated Ladakh observatory intercepts an audio pattern that mirrors human heartbeat frequencies. When she attempts to report it, her transmission equipment is remotely disabled.",
                'ai_result': "## The Silent Signal\n\n**Logline:** In the desolate heights of Ladakh, an isolated radio astronomer intercepts a rhythmic deep-space transmission matching human cardiovascular rhythms, only to trigger a lethal military lockdown before she can share the proof.\n\n### Act I: The Echo\nDr. Tara Sen works nocturnal shifts at the Hanle High-Altitude Observatory...",
                'mode': WritingMode.STORY,
                'language': WritingLanguage.ENGLISH,
                'tone': WritingTone.CINEMATIC
            }
        )
        if doc_created:
            self.stdout.write(self.style.SUCCESS(f"Created sample document: {sample_doc.title}"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
