import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs


def fetch_posts(blog_url, limit, offset):
    posts = []
    next_page_url = blog_url

    for _ in range(offset + limit):
        if next_page_url:
            print(f"Fetching posts from page: {next_page_url}")
            response = requests.get(next_page_url)
            # if response is not 200, print error and continue to next page
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            print(f"Parsing posts from page: {next_page_url}")

            if _ >= offset:
                for element in soup.find_all('div', class_='post'):
                    url = element.find(
                        class_='post-title').find('a').get('href')
                    post_id = re.sub(r'\W+', '', url)
                    text = element.find(class_='post-body').text.strip()
                    posts.append({'id': post_id, 'text': text, 'url': url})

            # Find the next page URL
            older_posts_link = soup.find('a', class_='blog-pager-older-link')
            if older_posts_link:
                next_page_url = older_posts_link.get('href')
            else:
                next_page_url = None
        else:
            break

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
    blog_url = 'https://gurneyjourney.blogspot.com'
    limit = 10000  # Number of pages to fetch
    offset = 0  # Starting page offset

    posts = fetch_posts(blog_url, limit, offset)

    for post in posts:
        response = send_post_to_upsert(post)
        print(f"Upserted post: {post['id']} - Status: {response.status_code}")
