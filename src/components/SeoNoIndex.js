import { useEffect } from 'react';

/**
 * Soft indexing guidance only — never a substitute for auth.
 */
export default function SeoNoIndex({ title }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    let robots = document.querySelector('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const previousContent = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (title) document.title = previousTitle;
      if (created) {
        robots.remove();
      } else if (previousContent != null) {
        robots.setAttribute('content', previousContent);
      } else {
        robots.removeAttribute('content');
      }
    };
  }, [title]);

  return null;
}
