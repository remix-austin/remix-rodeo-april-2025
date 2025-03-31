import { tryToFetchRemixAustinInfo } from '~/utils/meetup.server';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'New React Router App' },
        { name: 'description', content: 'Welcome to React Router!' }
    ];
}

export async function loader() {
    const group = await tryToFetchRemixAustinInfo();

    return {
        link: group?.link,
        nextEvent: group?.upcomingEvents.edges[0]?.node
    };
}

export default function Home({ loaderData }: Route.ComponentProps) {
    const siteTitle = 'Welcome to Remix Austin!';

    return (
        <div className="p-8">
            <h1 className="mb-4 inline-block text-5xl font-bold">
                {siteTitle}
            </h1>
            <p className="mb-8">
                We are the premiere Remix community for developers in Austin,
                and we stream remotely all over the world!
            </p>
            <h3 className="text 2xl font-bold mb-4">Meetup API response:</h3>
            <pre>
                <code className="block bg-zinc-800 p-4 rounded text-sm text-zinc-100">
                    {JSON.stringify(loaderData.nextEvent, null, 2)}
                </code>
            </pre>
        </div>
    );
}
