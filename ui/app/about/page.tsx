import Image from 'next/image';
import tagline from '../../public/tagline.webp';
import jgWithPencil from '../../public/jg_with_pencil.webp';

export default function About() {
	return (
		<div className="flex w-full flex-col items-center px-4 py-8">
			<div className="flex w-full max-w-3xl flex-col space-y-4">
				<Image src={jgWithPencil} height={100} alt="JG with Pencil" />
				<Image src={tagline} height={24} alt="Tagline" className="pb-6" />
				<p>
					This site aims to give people an easy way to learn from James Gurney
					by asking questions.
				</p>
				<p>
					It was made by{' '}
					<a href="https://dangurney.net" rel="noreferrer">
						Dan Gurney
					</a>
				</p>
				<p>
					It is built around the{' '}
					<a href="https://github.com/openai/chatgpt-retrieval-plugin">
						ChatGPT Retrieval Plugin
					</a>
					, an open source project from OpenAI which is a Python server that
					connects to a Pinecone vector database. You can feed it written
					material, and it will categorize the text using vector embeddings,
					which are essentially a series of numbers that assign unique meaning
					to the text.{' '}
				</p>
				<p>
					Here is a <a href="https://overcast.fm/+rTsUksngA">podcast episode</a>{' '}
					with a great explanation of vectors if you{"'"}re curious.
				</p>
				<p>
					The cool part is that once all your material is categorized with
					vector embeddings, you can take any question and find the material
					that is most similar. It is <em>much</em> more powerful and precise
					than a simple string search, since it will search on the underlying
					meaning of the query.
				</p>
				<p>
					Given this backend server, I then built a simple chat UI with NextJS.
					It takes the chats in your current session, finds the most relevant
					material in the vector DB, and then sends it all as a prompt to the
					ChatGPT API. The prompt is basically: {'"'}Imagine you are James
					Gurney. Given these chats and this background material, answer the
					user{"'"}s question as best you can. You can infer from the material
					but don{"'"}t make anything up.{'"'}
				</p>
				<p>
					So far the database has been populated with GurneyJourney blog posts,
					transcripts of instructional videos like the {'"'}In The Wild{'"'}{' '}
					series, and magazine interviews.
				</p>
				<p>
					Over time we{"'"}ll add more material to the database. We may also
					explore making this available as a ChatGPT plugin.
				</p>
				<p>
					The code is open sourced{' '}
					<a href="https://github.com/dgurns/jamesgurney-knowledgebase">here</a>
					.
				</p>
			</div>
		</div>
	);
}
