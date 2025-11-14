import { allPosts } from "contentlayer/generated";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-12 text-center dark:bg-zinc-900 dark:text-zinc-100">
      <h1 className="text-4xl font-semibold tracking-tight">klabo.world · Next stack</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-300">
        Contentlayer currently sees {allPosts.length} post(s). Update <code>content/posts</code> to add more.
      </p>
      <ul className="text-sm text-zinc-500 dark:text-zinc-400">
        {allPosts.slice(0, 3).map((post) => (
          <li key={post._id}>
            <a href={`/posts/${post.slug}`} className="font-medium text-blue-600">
              {post.title}
            </a>{' '}
            – {post.summary}
          </li>
        ))}
      </ul>
    </div>
  );
}
