from .base import build_full_prompt, SYSTEM_CORE_DIRECTIVE
from .blog import BLOG_TRANSFORM_DIRECTIVE, BLOG_INTRO_DIRECTIVE, BLOG_CONCLUSION_DIRECTIVE
from .article import ARTICLE_TRANSFORM_DIRECTIVE, ARTICLE_OUTLINE_DIRECTIVE
from .story import STORY_TRANSFORM_DIRECTIVE, STORY_BEATS_DIRECTIVE
from .screenplay import SCREENPLAY_DRAFT_DIRECTIVE
from .movie_series import MOVIE_STORY_DIRECTIVE, WEB_SERIES_DIRECTIVE
from .actions import ACTION_PROMPTS, get_action_directive

def get_mode_directive(mode: str) -> str:
    mapping = {
        'blog': BLOG_TRANSFORM_DIRECTIVE,
        'article': ARTICLE_TRANSFORM_DIRECTIVE,
        'story': STORY_TRANSFORM_DIRECTIVE,
        'movie_web_series': MOVIE_STORY_DIRECTIVE,
        'screenplay': SCREENPLAY_DRAFT_DIRECTIVE,
    }
    return mapping.get(mode, BLOG_TRANSFORM_DIRECTIVE)

__all__ = [
    'build_full_prompt',
    'SYSTEM_CORE_DIRECTIVE',
    'ACTION_PROMPTS',
    'get_action_directive',
    'get_mode_directive',
    'BLOG_TRANSFORM_DIRECTIVE',
    'ARTICLE_TRANSFORM_DIRECTIVE',
    'STORY_TRANSFORM_DIRECTIVE',
    'SCREENPLAY_DRAFT_DIRECTIVE',
    'MOVIE_STORY_DIRECTIVE',
    'WEB_SERIES_DIRECTIVE',
]
