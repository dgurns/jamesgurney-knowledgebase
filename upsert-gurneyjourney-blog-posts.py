import os
import re
import requests
from bs4 import BeautifulSoup, Tag
from typing import Union


def fetch_posts(start_url: str):
    posts = []
    next_page_url: Union[str, None] = start_url

    while next_page_url:
        print(f"So far, have {len(posts)} posts")
        print(f"Fetching posts from page: {next_page_url}")
        response = requests.get(next_page_url)
        # if response is not 200, print error and continue to next page
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        print(f"Parsing posts from page: {next_page_url}")

        for element in soup.find_all('div', class_='post'):
            try:
                url = element.find(
                    class_='post-title').find('a').get('href')
                post_id = re.sub(r'\W+', '', url)
                text = element.find(class_='post-body').text.strip()
                posts.append({'id': post_id, 'text': text, 'url': url})
            except AttributeError:
                pass

        # Find the next page URL
        older_posts_link = soup.find('a', class_='blog-pager-older-link')
        if isinstance(older_posts_link, Tag):
            older_href = older_posts_link.get('href')
            if isinstance(older_href, str):
                next_page_url = older_href
        else:
            next_page_url = None

    return posts


def send_post_to_upsert(post):
    upsert_url = 'http://0.0.0.0:8000/upsert'
    document = {
        'id': post['id'],
        'text': post['text'],
        'metadata': {
            'url': post['url']
        }
    }
    data = {
        'documents': [document]
    }
    headers = {
        'Authorization': f"Bearer {os.environ['BEARER_TOKEN']}"
    }
    response = requests.post(upsert_url, json=data, headers=headers)
    return response


if __name__ == '__main__':
    start_url = 'https://gurneyjourney.blogspot.com'

    posts = fetch_posts(start_url)
    print(f"Fetched {len(posts)} posts from Blogspot")

    for post in posts:
        response = send_post_to_upsert(post)
        print(f"Upserted post: {post['id']} - Status: {response.status_code}")
