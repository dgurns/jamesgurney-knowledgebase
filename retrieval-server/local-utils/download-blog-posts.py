#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
# ]
# ///
"""
Download all blog posts from Gurney Journey (gurneyjourney.blogspot.com).

Saves posts as:
- Individual JSON files organized by year
- Yearly combined TXT files (ready for Google NotebookLM upload)

Usage:
    uv run download-blog-posts.py --output-dir ../../blog-archive
    uv run download-blog-posts.py --resume  # Continue from last saved state
"""

import argparse
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup, Tag


def extract_date_from_url(url: str) -> Optional[str]:
    """Extract date from Blogspot URL format: /YYYY/MM/post-title.html"""
    match = re.search(r'/(\d{4})/(\d{2})/', url)
    if match:
        year, month = match.groups()
        return f"{year}-{month}"
    return None


def extract_date_from_element(element: Tag) -> Optional[str]:
    """Try to extract date from post element's date header."""
    date_header = element.find_previous('h2', class_='date-header')
    if date_header:
        date_text = date_header.get_text(strip=True)
        # Try parsing common Blogger date formats
        for fmt in ['%A, %B %d, %Y', '%B %d, %Y', '%d %B %Y']:
            try:
                parsed = datetime.strptime(date_text, fmt)
                return parsed.strftime('%Y-%m-%d')
            except ValueError:
                continue
    return None


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')[:50]


def fetch_posts(start_url: str, delay: float = 1.0, state_file: Optional[Path] = None):
    """
    Fetch all posts from the blog, handling pagination.

    Args:
        start_url: URL to start fetching from
        delay: Seconds to wait between requests
        state_file: Path to save progress state for resumption
    """
    posts = []
    next_page_url: Optional[str] = start_url
    page_count = 0

    # Load previous state if resuming
    if state_file and state_file.exists():
        with open(state_file) as f:
            state = json.load(f)
            posts = state.get('posts', [])
            next_page_url = state.get('next_page_url')
            page_count = state.get('page_count', 0)
            print(f"Resuming from page {page_count} with {len(posts)} posts already saved")

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (compatible; BlogArchiver/1.0; for personal archival)'
    })

    while next_page_url:
        page_count += 1
        print(f"[Page {page_count}] Fetching: {next_page_url} (Total posts: {len(posts)})")

        try:
            response = session.get(next_page_url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"  Error fetching page: {e}")
            print("  Saving state and retrying in 5 seconds...")
            if state_file:
                save_state(state_file, posts, next_page_url, page_count)
            time.sleep(5)
            continue

        soup = BeautifulSoup(response.text, 'html.parser')
        page_posts = 0

        for element in soup.find_all('div', class_='post'):
            try:
                # Extract title
                title_elem = element.find(class_='post-title')
                if not title_elem:
                    continue

                link = title_elem.find('a')
                if not link:
                    continue

                url = link.get('href', '')
                title = link.get_text(strip=True) or 'Untitled'

                # Extract date
                date = extract_date_from_element(element)
                if not date:
                    date_from_url = extract_date_from_url(url)
                    if date_from_url:
                        date = date_from_url + '-01'  # Approximate to first of month
                    else:
                        date = 'unknown'

                # Extract content
                body_elem = element.find(class_='post-body')
                content = body_elem.get_text(strip=True) if body_elem else ''

                # Create post ID from URL
                post_id = re.sub(r'\W+', '', url)

                # Skip if we already have this post (for resume)
                if any(p['url'] == url for p in posts):
                    continue

                posts.append({
                    'id': post_id,
                    'title': title,
                    'date': date,
                    'url': url,
                    'content': content
                })
                page_posts += 1

            except AttributeError as e:
                print(f"  Warning: Could not parse a post element: {e}")
                continue

        print(f"  Found {page_posts} new posts on this page")

        # Find next page
        older_posts_link = soup.find('a', class_='blog-pager-older-link')
        if isinstance(older_posts_link, Tag):
            older_href = older_posts_link.get('href')
            if isinstance(older_href, str):
                next_page_url = older_href
            else:
                next_page_url = None
        else:
            next_page_url = None

        # Save state periodically
        if state_file and page_count % 10 == 0:
            save_state(state_file, posts, next_page_url, page_count)
            print(f"  Progress saved ({len(posts)} posts)")

        # Rate limiting
        if next_page_url:
            time.sleep(delay)

    return posts


def save_state(state_file: Path, posts: list, next_page_url: Optional[str], page_count: int):
    """Save current progress to state file."""
    with open(state_file, 'w') as f:
        json.dump({
            'posts': posts,
            'next_page_url': next_page_url,
            'page_count': page_count,
            'saved_at': datetime.now().isoformat()
        }, f)


def save_individual_posts(posts: list, output_dir: Path):
    """Save each post as an individual JSON file, organized by year."""
    posts_dir = output_dir / 'posts'

    for post in posts:
        # Extract year from date
        year = post['date'][:4] if post['date'] != 'unknown' else 'unknown'
        year_dir = posts_dir / year
        year_dir.mkdir(parents=True, exist_ok=True)

        # Create filename
        date_prefix = post['date'] if post['date'] != 'unknown' else 'unknown'
        slug = slugify(post['title'])
        filename = f"{date_prefix}-{slug}.json" if slug else f"{date_prefix}-{post['id'][:20]}.json"

        filepath = year_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(post, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(posts)} individual post files to {posts_dir}")


def save_yearly_combined(posts: list, output_dir: Path):
    """Save posts combined by year as TXT files (for NotebookLM)."""
    yearly_dir = output_dir / 'yearly'
    yearly_dir.mkdir(parents=True, exist_ok=True)

    # Group posts by year
    posts_by_year: dict[str, list] = {}
    for post in posts:
        year = post['date'][:4] if post['date'] != 'unknown' else 'unknown'
        if year not in posts_by_year:
            posts_by_year[year] = []
        posts_by_year[year].append(post)

    # Sort posts within each year by date (newest first)
    for year in posts_by_year:
        posts_by_year[year].sort(key=lambda p: p['date'], reverse=True)

    # Write yearly files
    for year, year_posts in sorted(posts_by_year.items(), reverse=True):
        filepath = yearly_dir / f"{year}-all-posts.txt"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"GURNEY JOURNEY BLOG - {year}\n")
            f.write(f"Total posts: {len(year_posts)}\n")
            f.write("=" * 80 + "\n\n")

            for post in year_posts:
                # Format date nicely if possible
                try:
                    if post['date'] != 'unknown':
                        date_obj = datetime.strptime(post['date'], '%Y-%m-%d')
                        date_str = date_obj.strftime('%B %d, %Y')
                    else:
                        date_str = 'Unknown date'
                except ValueError:
                    date_str = post['date']

                f.write(f"--- {date_str} ---\n")
                f.write(f"Title: {post['title']}\n")
                f.write(f"URL: {post['url']}\n\n")
                f.write(post['content'])
                f.write("\n\n" + "-" * 40 + "\n\n")

        print(f"  {year}: {len(year_posts)} posts -> {filepath.name}")

    print(f"\nSaved {len(posts_by_year)} yearly files to {yearly_dir}")


def save_metadata(posts: list, output_dir: Path):
    """Save a metadata index of all posts."""
    metadata = {
        'total_posts': len(posts),
        'date_range': {
            'earliest': min((p['date'] for p in posts if p['date'] != 'unknown'), default='unknown'),
            'latest': max((p['date'] for p in posts if p['date'] != 'unknown'), default='unknown'),
        },
        'generated_at': datetime.now().isoformat(),
        'posts': [
            {
                'title': p['title'],
                'date': p['date'],
                'url': p['url']
            }
            for p in sorted(posts, key=lambda x: x['date'], reverse=True)
        ]
    }

    filepath = output_dir / 'metadata.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"Saved metadata index to {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description='Download all posts from Gurney Journey blog',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python download-blog-posts.py --output-dir ../../blog-archive
    python download-blog-posts.py --resume  # Continue interrupted download
    python download-blog-posts.py --delay 2  # Slower requests (be extra nice)
        """
    )
    parser.add_argument(
        '--output-dir', '-o',
        type=Path,
        default=Path('../../blog-archive'),
        help='Output directory for downloaded posts (default: ../../blog-archive)'
    )
    parser.add_argument(
        '--start-url',
        default='https://gurneyjourney.blogspot.com',
        help='Starting URL (default: blog homepage)'
    )
    parser.add_argument(
        '--delay', '-d',
        type=float,
        default=1.0,
        help='Seconds to wait between page requests (default: 1.0)'
    )
    parser.add_argument(
        '--resume', '-r',
        action='store_true',
        help='Resume from last saved state'
    )
    parser.add_argument(
        '--skip-individual',
        action='store_true',
        help='Skip saving individual JSON files (only save yearly combined)'
    )

    args = parser.parse_args()

    # Setup output directory
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    state_file = output_dir / '.download-state.json'

    print(f"Gurney Journey Blog Downloader")
    print(f"==============================")
    print(f"Output directory: {output_dir}")
    print(f"Request delay: {args.delay}s")
    print()

    # Fetch posts
    if args.resume and state_file.exists():
        print("Resuming previous download...")
    else:
        print("Starting fresh download...")
        if state_file.exists():
            state_file.unlink()

    posts = fetch_posts(
        start_url=args.start_url,
        delay=args.delay,
        state_file=state_file
    )

    print(f"\nFetched {len(posts)} total posts")
    print()

    # Save posts
    if not args.skip_individual:
        print("Saving individual post files...")
        save_individual_posts(posts, output_dir)
        print()

    print("Saving yearly combined files (for NotebookLM)...")
    save_yearly_combined(posts, output_dir)
    print()

    print("Saving metadata index...")
    save_metadata(posts, output_dir)
    print()

    # Cleanup state file on successful completion
    if state_file.exists():
        state_file.unlink()
        print("Cleaned up state file (download complete)")

    print("\nDone! Upload the files in 'yearly/' to Google NotebookLM.")


if __name__ == '__main__':
    main()
